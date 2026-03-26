import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-olvidepassword',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './olvidepassword.html',
  styleUrl: './olvidepassword.css'
})
export class OlvidepasswordComponent implements OnInit, OnDestroy {

  currentStep: number = 1;
  readonly selectedMethod: 'correo' = 'correo';
  contacto: string = '';
  contactoError: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  readonly otpIndexes: number[] = [0, 1, 2, 3, 4, 5];
  otpError: string = '';
  codigoGenerado: string = '';
  resendSeconds: number = 60;
  private resendInterval: ReturnType<typeof setInterval> | null = null;
  resendLoading: boolean = false;
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  passwordError: string = '';
  showNueva: boolean = false;
  showConfirmar: boolean = false;
  loading: boolean = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  goToStep2(): void {
    this.currentStep = 2;
    this.contacto = '';
    this.contactoError = '';
  }

  validarContacto(): boolean {
    this.contactoError = '';
    if (!this.contacto.trim()) {
      this.contactoError = 'Este campo es obligatorio.';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contacto.trim())) {
      this.contactoError = 'Ingresa un correo válido.';
      return false;
    }
    return true;
  }

  enviarCodigo(): void {
    if (!this.validarContacto()) return;

    this.loading = true;
    this.contactoError = '';

    this.codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    this.usuarioService.enviarCodigoRecuperacion(
      this.contacto.trim().toLowerCase(),
      this.selectedMethod,
      this.codigoGenerado
    )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges(); // ← FUERZA actualización de la vista
        })
      )
      .subscribe({
        next: (res) => {
          console.log('Respuesta servidor:', res);
          this.avanzarAOTP();
          this.cdr.detectChanges(); // ← fuerza el paso de step
        },
        error: (e) => {
          this.contactoError = e.error?.error || 'No se pudo enviar el código. Verifica tus datos.';
          console.error('Error en peticion:', e);
        }
      });
  }

  private avanzarAOTP(): void {
    console.log(`[DEV] Código OTP simulado: ${this.codigoGenerado}`);
    this.currentStep = 3;
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
    this.startResendTimer();
    setTimeout(() => {
      (document.querySelector('#otp-0') as HTMLInputElement)?.focus();
    }, 100);
  }

  startResendTimer(): void {
    this.clearResendTimer();
    this.resendSeconds = 60;
    this.cdr.detectChanges();

    this.resendInterval = setInterval(() => {
      this.ngZone.run(() => {
        if (this.resendSeconds > 0) {
          this.resendSeconds--;
        }

        if (this.resendSeconds <= 0) {
          this.clearResendTimer();
        }

        // Forzar render del valor en cada tick para evitar que "se congele" visualmente.
        this.cdr.detectChanges();
      });
    }, 1000);
  }

  clearResendTimer(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  reenviarCodigo(): void {
    if (this.resendSeconds > 0 || this.resendLoading) return;

    this.resendLoading = true;
    this.otpError = '';
    this.codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    this.usuarioService.enviarCodigoRecuperacion(
      this.contacto.trim().toLowerCase(),
      this.selectedMethod,
      this.codigoGenerado
    )
      .pipe(
        finalize(() => {
          this.resendLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.otpDigits = ['', '', '', '', '', ''];
          this.startResendTimer();
          setTimeout(() => this.focusOtp(0), 50);
        },
        error: (e) => {
          this.otpError = e.error?.error || 'No se pudo reenviar el código. Intenta nuevamente.';
          console.error('Error al reenviar código:', e);
        }
      });
  }

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');

    if (!digits) {
      this.otpDigits[index] = '';
      input.value = '';
      return;
    }

    let cursor = index;
    for (const digit of digits) {
      if (cursor > 5) break;
      this.otpDigits[cursor] = digit;
      cursor++;
    }

    this.syncOtpInputs();
    if (cursor <= 5) {
      this.focusOtp(cursor);
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();

      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
        this.syncOtpInputs();
        return;
      }

      if (index > 0) {
        this.otpDigits[index - 1] = '';
        this.syncOtpInputs();
        this.focusOtp(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtp(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtp(index + 1);
      return;
    }

    if (event.key.length === 1 && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '') ?? '';
    if (!paste) return;

    let cursor = index;
    for (const digit of paste) {
      if (cursor > 5) break;
      this.otpDigits[cursor] = digit;
      cursor++;
    }

    this.syncOtpInputs();
    if (cursor <= 5) {
      this.focusOtp(cursor);
    }
  }

  private focusOtp(index: number): void {
    (document.querySelector(`#otp-${index}`) as HTMLInputElement)?.focus();
  }

  private syncOtpInputs(): void {
    for (let i = 0; i < 6; i++) {
      const otpInput = document.querySelector(`#otp-${i}`) as HTMLInputElement | null;
      if (otpInput) {
        otpInput.value = this.otpDigits[i] ?? '';
      }
    }
  }

  verificarCodigo(): void {
    this.otpError = '';
    const codigoIngresado = this.otpDigits.join('');

    console.log('Digits array:', this.otpDigits);
    console.log('Código ingresado:', codigoIngresado);
    console.log('Código generado:', this.codigoGenerado);

    if (codigoIngresado.length < 6) {
      this.otpError = 'Ingresa los 6 dígitos del código.';
      return;
    }
    if (codigoIngresado !== this.codigoGenerado) {
      this.otpError = 'Código incorrecto. Inténtalo de nuevo.';
      this.otpDigits = ['', '', '', '', '', ''];
      setTimeout(() => (document.querySelector('#otp-0') as HTMLInputElement)?.focus(), 50);
      return;
    }
    this.clearResendTimer();
    this.currentStep = 4;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.passwordError = '';
  }

  get passwordStrength(): { level: number; label: string; color: string } {
    const pwd = this.nuevaPassword;
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { level: 1, label: 'Muy débil', color: '#e63946' },
      { level: 2, label: 'Débil', color: '#f4a261' },
      { level: 3, label: 'Media', color: '#e9c46a' },
      { level: 4, label: 'Fuerte', color: '#4caf50' },
    ];
    return levels[score - 1] ?? levels[0];
  }

  get strengthWidth(): string {
    return `${(this.passwordStrength.level / 4) * 100}%`;
  }

  validarPassword(): boolean {
    this.passwordError = '';
    if (this.nuevaPassword.length < 8) {
      this.passwordError = 'La contraseña debe tener al menos 8 caracteres.';
      return false;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return false;
    }
    return true;
  }

  actualizarPassword(): void {
    if (!this.validarPassword()) return;
    this.loading = true;

    this.usuarioService.actualizarPasswordPorContacto(
      this.contacto.trim().toLowerCase(),
      this.nuevaPassword
    ).subscribe({
      next: () => {
        this.sincronizarLocalStorage();
        this.loading = false;
        this.currentStep = 5;
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        this.loading = false;
        this.passwordError = 'Error al actualizar. Intenta de nuevo.';
        console.error(e);
      }
    });
  }

  private sincronizarLocalStorage(): void {
    const correoGuardado = localStorage.getItem('correoUsuario');
    const coincide =
      (correoGuardado ?? '').trim().toLowerCase() === this.contacto.trim().toLowerCase();

    if (coincide) {
      localStorage.setItem('passwordUsuario', this.nuevaPassword);
      const raw = localStorage.getItem('usuario');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          u.pass = this.nuevaPassword;
          localStorage.setItem('usuario', JSON.stringify(u));
        } catch { }
      }
    }
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    if (this.currentStep > 1) {
      if (this.currentStep === 3) this.clearResendTimer();
      this.currentStep--;
    } else {
      this.router.navigate(['/login']);
    }
  }
}
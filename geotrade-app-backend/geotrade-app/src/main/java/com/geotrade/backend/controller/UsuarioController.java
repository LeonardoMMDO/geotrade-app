package com.geotrade.backend.controller;

import com.geotrade.backend.model.Usuario;
import com.geotrade.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController 
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String remitente;

    // ── DEBUG: Listar todos los usuarios ───────────────────────
    @GetMapping("/Lista-debug")
    public List<Usuario> listaDebug() {
        return usuarioRepository.findAll();
    }

    // ── Registrar ─────────────────────────────────────────────
    @PostMapping("/registrar")
    public Usuario registrar(@RequestBody Usuario usuario) {
        if (usuario.getCorreo() != null) {
            usuario.setCorreo(usuario.getCorreo().trim().toLowerCase());
        }
        return usuarioRepository.save(usuario);
    }

    // ── Login ──────────────────────────────────────────────────
    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Usuario loginData) {
    if (loginData == null || loginData.getCorreo() == null || loginData.getPass() == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Correo y contraseña son requeridos"));
    }

    String input = loginData.getCorreo().trim();
    String passLimpia = loginData.getPass().trim();

    if (input.isEmpty() || passLimpia.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("error", "Correo y contraseña no pueden estar vacíos"));
    }

    // Buscar por correo primero
    List<Usuario> usuarios = usuarioRepository.findByCorreoIgnoreCase(input.toLowerCase());

    // Si no encontró por correo, buscar por nombre
    if (usuarios.isEmpty()) {
        usuarios = usuarioRepository.findByNombreExacto(input);
    }

    if (usuarios.size() > 1) {
        System.out.println("ADVERTENCIA: " + usuarios.size() + " registros con el mismo dato.");
    }

    Usuario usuario = usuarios.isEmpty() ? null : usuarios.get(0);

    if (usuario == null || !usuario.getPass().trim().equals(passLimpia)) {
        System.out.println("Credenciales incorrectas: " + input);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                             .body(Map.of("error", "Credenciales incorrectas"));
    }

    // ← CLAVE: solo bloquear si activa es EXPLICITAMENTE false, no si es null
    if (usuario.getActiva() != null && !usuario.getActiva()) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                             .body(Map.of("error", "Tu cuenta ha sido desactivada. Contacta al administrador."));
    }

    System.out.println("Login exitoso: " + input);
    return ResponseEntity.ok(usuario);
}

    // ── NUEVO: Activar / desactivar cuenta ────────────────────
    @PatchMapping("/{id}/activa")
    public ResponseEntity<?> actualizarEstadoCuenta(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean activa = body.get("activa");
        if (activa == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo activa es obligatorio."));
        }

        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado."));
        }

        usuario.setActiva(activa);
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(usuario);
    }

    // ── Actualizar perfil ──────────────────────────────────────
    @PutMapping("/actualizar/{id}")
    public Usuario actualizar(@PathVariable Long id, @RequestBody Usuario datosActualizados) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setNombre(datosActualizados.getNombre());
        usuario.setCorreo(datosActualizados.getCorreo());
        usuario.setTelefono(datosActualizados.getTelefono());

        if (datosActualizados.getPass() != null && !datosActualizados.getPass().isEmpty()) {
            usuario.setPass(datosActualizados.getPass());
        }

        return usuarioRepository.save(usuario);
    }

  // ── Enviar código OTP ──────────────────────────────────────
    @PostMapping("/enviar-codigo")
    public ResponseEntity<?> enviarCodigo(@RequestBody Map<String, String> body) {
        String contacto = body.get("contacto") != null ? body.get("contacto").trim() : null;
        String metodo   = body.get("metodo");
        String codigo   = body.get("codigo");

        if (contacto == null || metodo == null || codigo == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faltan datos requeridos."));
        }

        boolean existe = false;
        if ("correo".equals(metodo)) {
            existe = usuarioRepository.existsByCorreoIgnoreCase(contacto);
        } else if ("sms".equals(metodo)) {
            existe = usuarioRepository.existsByTelefono(contacto);
        }

        if (!existe) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(Map.of("error", "No se encontró ninguna cuenta con ese dato."));
        }

        try {
            if ("correo".equals(metodo)) {
                System.out.println("=== INICIANDO ENVÍO DE CORREO ===");
                enviarCorreo(contacto, codigo);
                System.out.println("=== CORREO ENVIADO EXITOSAMENTE ===");
            } else if ("sms".equals(metodo)) {
                System.out.println("=== INICIANDO ENVÍO DE SMS ===");
                // LLAMADA A LA FUNCIÓN DE TWILIO
                enviarSms(contacto, codigo);
                System.out.println("=== SMS ENVIADO EXITOSAMENTE ===");
            }
        } catch (Exception e) {
            System.err.println("=== ERROR EN EL PROCESO DE ENVÍO ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Error al enviar el código: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("mensaje", "Código enviado correctamente."));
    }

    

private void enviarSms(String telefonoDestino, String codigo) {
    // 1. Aquí pondrás los datos que verás en tu panel de Vonage
    

   

}


    // ── Método privado: enviar correo real ─────────────────────
    private void enviarCorreo(String destinatario, String codigo) {
        if (mailSender == null) {
            System.out.println("[DEV - SMTP no configurado] Código: " + codigo + " → " + destinatario);
            return;
        }
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject("Código de recuperación - GeoTrade");
        mensaje.setText(
            "Hola,\n\n" +
            "Tu código de verificación para restablecer tu contraseña es:\n\n" +
            "        " + codigo + "\n\n" +
            "Este código es válido por 10 minutos.\n" +
            "Si no solicitaste esto, ignora este mensaje.\n\n" +
            "— Equipo GeoTrade"
        );
        mailSender.send(mensaje);
    }

    // ── Actualizar contraseña por contacto ─────────────────────
    @PutMapping("/actualizar-password")
    public ResponseEntity<?> actualizarPassword(@RequestBody Map<String, String> body) {
        String contacto      = body.get("contacto");
        String nuevaPassword = body.get("nuevaPassword");

        if (contacto == null || nuevaPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faltan datos requeridos."));
        }

        List<Usuario> porCorreo = usuarioRepository.findByCorreoIgnoreCase(contacto.trim());
        Usuario usuario = porCorreo.isEmpty() ? null : porCorreo.get(0);

        if (usuario == null) {
            Optional<Usuario> porTelefono = usuarioRepository.findByTelefono(contacto.trim());
            usuario = porTelefono.orElse(null);
        }

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(Map.of("error", "No se encontró ninguna cuenta con ese dato."));
        }

        usuario.setPass(nuevaPassword);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente"));
    }

    @GetMapping("/existe-correo")
    public ResponseEntity<?> existeCorreo(@RequestParam String correo) {
        boolean existe = usuarioRepository.existsByCorreoIgnoreCase(correo.trim());
        return ResponseEntity.ok(Map.of("existe", existe));
    }

}
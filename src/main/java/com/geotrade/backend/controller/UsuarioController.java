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

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String remitente;

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
    public Usuario login(@RequestBody Usuario loginData) {
        String correoLimpio = loginData.getCorreo().trim().toLowerCase();
        String passLimpia   = loginData.getPass().trim();

        List<Usuario> usuarios = usuarioRepository.findByCorreoIgnoreCase(correoLimpio);
        Usuario usuario = usuarios.isEmpty() ? null : usuarios.get(0);

        if (usuarios.size() > 1) {
            System.out.println("ADVERTENCIA: " + usuarios.size() + " registros con el mismo correo.");
        }

        if (usuario != null && usuario.getPass().trim().equals(passLimpia)) {
            System.out.println("Login exitoso: " + correoLimpio);
            return usuario;
        } else {
            System.out.println("Credenciales incorrectas: " + correoLimpio);
            throw new RuntimeException("Credenciales incorrectas");
        }
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

        System.out.println("=== INTENTANDO ENVIAR CORREO ===");
        System.out.println("Destinatario: " + contacto);
        System.out.println("Código: " + codigo);
        System.out.println("mailSender es null: " + (mailSender == null));

        try {
            if ("correo".equals(metodo)) {
                enviarCorreo(contacto, codigo);
                System.out.println("=== CORREO ENVIADO EXITOSAMENTE ===");
            } else if ("sms".equals(metodo)) {
                System.out.println("[SMS] Código: " + codigo + " → " + contacto);
            }
        } catch (Exception e) {
            System.err.println("=== ERROR AL ENVIAR CORREO ===");
            System.err.println("Tipo: " + e.getClass().getName());
            System.err.println("Mensaje: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Error al enviar el código: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("mensaje", "Código enviado correctamente."));
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
}
package com.geotrade.backend.controller;

import com.geotrade.backend.model.Opinion;
import com.geotrade.backend.model.Usuario;
import com.geotrade.backend.repository.OpinionRepository;
import com.geotrade.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/opiniones")
public class OpinionController {

    @Autowired
    private OpinionRepository opinionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public static class OpinionRequest {
        private String lugarId;
        private Integer calificacion;
        private String texto;

        public String getLugarId() {
            return lugarId;
        }

        public void setLugarId(String lugarId) {
            this.lugarId = lugarId;
        }

        public Integer getCalificacion() {
            return calificacion;
        }

        public void setCalificacion(Integer calificacion) {
            this.calificacion = calificacion;
        }

        public String getTexto() {
            return texto;
        }

        public void setTexto(String texto) {
            this.texto = texto;
        }
    }

    public static class OpinionResponse {
        private Long id;
        private Long usuarioId;
        private String usuarioNombre;
        private String lugarId;
        private Integer calificacion;
        private String texto;
        private LocalDateTime fechaCreacion;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getUsuarioId() {
            return usuarioId;
        }

        public void setUsuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
        }

        public String getUsuarioNombre() {
            return usuarioNombre;
        }

        public void setUsuarioNombre(String usuarioNombre) {
            this.usuarioNombre = usuarioNombre;
        }

        public String getLugarId() {
            return lugarId;
        }

        public void setLugarId(String lugarId) {
            this.lugarId = lugarId;
        }

        public Integer getCalificacion() {
            return calificacion;
        }

        public void setCalificacion(Integer calificacion) {
            this.calificacion = calificacion;
        }

        public String getTexto() {
            return texto;
        }

        public void setTexto(String texto) {
            this.texto = texto;
        }

        public LocalDateTime getFechaCreacion() {
            return fechaCreacion;
        }

        public void setFechaCreacion(LocalDateTime fechaCreacion) {
            this.fechaCreacion = fechaCreacion;
        }
    }

    private OpinionResponse toResponse(Opinion opinion) {
        OpinionResponse response = new OpinionResponse();
        response.setId(opinion.getId());
        response.setLugarId(opinion.getLugarId());
        response.setCalificacion(opinion.getCalificacion());
        response.setTexto(opinion.getTexto());
        response.setFechaCreacion(opinion.getFechaCreacion());
        if (opinion.getUsuario() != null) {
            response.setUsuarioId(opinion.getUsuario().getId());
            response.setUsuarioNombre(opinion.getUsuario().getNombre());
        }
        return response;
    }

    // Obtener opiniones por lugar_id
    @GetMapping("/{lugarId}")
    public List<OpinionResponse> getOpiniones(@PathVariable String lugarId) {
        return opinionRepository.findByLugarId(lugarId).stream().map(this::toResponse).toList();
    }

    // Crear nueva opinión
    @PostMapping
    public ResponseEntity<?> crearOpinion(@RequestBody OpinionRequest request, @RequestParam Long usuarioId) {
        if (request.getLugarId() == null || request.getLugarId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El lugarId es obligatorio");
        }
        if (request.getCalificacion() == null || request.getCalificacion() < 1 || request.getCalificacion() > 5) {
            return ResponseEntity.badRequest().body("La calificación debe estar entre 1 y 5");
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (!usuarioOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Usuario no encontrado");
        }

        Opinion opinion = new Opinion();
        opinion.setUsuario(usuarioOpt.get());
        opinion.setLugarId(request.getLugarId().trim());
        opinion.setCalificacion(request.getCalificacion());
        opinion.setTexto(request.getTexto() != null ? request.getTexto().trim() : "");

        try {
            Opinion saved = opinionRepository.save(opinion);
            return ResponseEntity.ok(toResponse(saved));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.badRequest().body("No se pudo guardar la opinión. Verifica los datos enviados.");
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Error interno al guardar la opinión.");
        }
    }

    // Obtener opiniones por usuario (opcional)
    @GetMapping("/usuario/{usuarioId}")
    public List<Opinion> getOpinionesPorUsuario(@PathVariable Long usuarioId) {
        return opinionRepository.findByUsuarioId(usuarioId);
    }

    private ResponseEntity<?> eliminarOpinionPropietario(Long opinionId, Long usuarioId) {
        Optional<Opinion> opinionOpt = opinionRepository.findById(opinionId);
        if (!opinionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Opinion opinion = opinionOpt.get();
        if (opinion.getUsuario() == null || opinion.getUsuario().getId() == null) {
            return ResponseEntity.badRequest().body("La opinión no tiene un usuario asociado.");
        }

        if (!opinion.getUsuario().getId().equals(usuarioId)) {
            return ResponseEntity.status(403).body("No puedes eliminar la opinión de otro usuario.");
        }

        opinionRepository.delete(opinion);
        return ResponseEntity.ok(Map.of("mensaje", "Opinión eliminada correctamente"));
    }

    @DeleteMapping("/{opinionId}")
    public ResponseEntity<?> eliminarOpinion(@PathVariable Long opinionId, @RequestParam Long usuarioId) {
        return eliminarOpinionPropietario(opinionId, usuarioId);
    }

    @PostMapping("/{opinionId}/eliminar")
    public ResponseEntity<?> eliminarOpinionViaPost(@PathVariable Long opinionId, @RequestParam Long usuarioId) {
        return eliminarOpinionPropietario(opinionId, usuarioId);
    }
}
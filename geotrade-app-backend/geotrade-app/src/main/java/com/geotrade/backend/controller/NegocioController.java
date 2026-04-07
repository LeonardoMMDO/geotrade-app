package com.geotrade.backend.controller;

import com.geotrade.backend.model.Negocio;
import com.geotrade.backend.model.Sucursal;
import com.geotrade.backend.repository.NegocioRepository;
import com.geotrade.backend.repository.SucursalRepository;
import com.geotrade.backend.service.CloudinaryService; // Importante: importar tu nuevo servicio
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/negocios")
public class NegocioController {

    @Autowired
    private NegocioRepository negocioRepository;

    @Autowired
    private SucursalRepository sucursalRepository;

    @Autowired
    private CloudinaryService cloudinaryService; // 1. Inyectamos el servicio de Cloudinary

    @PostMapping(consumes = {"multipart/form-data"})
    public Negocio registrar(
            @RequestPart("negocio") Negocio negocio,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @RequestPart(value = "archivoIne", required = false) MultipartFile archivoIne) throws IOException {

        // 2. Subir múltiples fotos de la empresa a Cloudinary
        if (archivos != null && !archivos.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : archivos) {
                if (f != null && !f.isEmpty()) {
                    // Llamamos al servicio para obtener la URL de internet
                    String url = cloudinaryService.uploadImage(f);
                    urls.add(url);
                }
            }
            // Guardamos las URLs (ej: https://res.cloudinary.com/...) separadas por comas
            negocio.setFotos_url_empresa(String.join(",", urls));
        }

        // 3. Subir INE a Cloudinary
        if (archivoIne != null && !archivoIne.isEmpty()) {
            String urlIne = cloudinaryService.uploadImage(archivoIne);
            negocio.setIne_url_representante(urlIne);
        }

        return negocioRepository.save(negocio);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Negocio actualizar(
            @PathVariable Long id,
            @RequestPart("negocio") Negocio datosActualizados,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @RequestPart(value = "archivoIne", required = false) MultipartFile archivoIne) throws IOException {

        Negocio negocio = negocioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Negocio no encontrado"));

        // Mantener tus campos actuales
        negocio.setNombre_empresa(datosActualizados.getNombre_empresa());
        negocio.setCategoria_empresa(datosActualizados.getCategoria_empresa());
        negocio.setTelefono_empresa(datosActualizados.getTelefono_empresa());
        negocio.setDireccion_empresa(datosActualizados.getDireccion_empresa());
        negocio.setHorario_empresa(datosActualizados.getHorario_empresa());
        negocio.setCorreo_empresa(datosActualizados.getCorreo_empresa());
        negocio.setDescripcion_empresa(datosActualizados.getDescripcion_empresa());
        negocio.setLatitud(datosActualizados.getLatitud());
        negocio.setLongitud(datosActualizados.getLongitud());

        // Actualizar fotos en Cloudinary si se envían nuevas
        if (archivos != null && !archivos.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : archivos) {
                if (f != null && !f.isEmpty()) {
                    urls.add(cloudinaryService.uploadImage(f));
                }
            }
            negocio.setFotos_url_empresa(String.join(",", urls));
        }

        // Actualizar INE en Cloudinary si se envía nueva
        if (archivoIne != null && !archivoIne.isEmpty()) {
            negocio.setIne_url_representante(cloudinaryService.uploadImage(archivoIne));
        }

        return negocioRepository.save(negocio);
    }

    // --- EL RESTO DE TUS MÉTODOS SE MANTIENEN EXACTAMENTE IGUAL ---

    @GetMapping("/publicos/con-sucursales")
    public ResponseEntity<?> listarPublicosConSucursales() {
        List<Negocio> negocios = negocioRepository.findAll();
        List<Sucursal> todasSucursales = sucursalRepository.findAll();

        Map<Long, List<Sucursal>> sucursalesPorNegocio = new HashMap<>();
        for (Sucursal s : todasSucursales) {
            // Ajuste preventivo para evitar NullPointerException si getNegocio() es null
            if (s.getNegocio() != null) {
                Long idNegocio = s.getNegocio().getId();
                if (idNegocio != null) {
                    sucursalesPorNegocio
                        .computeIfAbsent(idNegocio, k -> new ArrayList<>())
                        .add(s);
                }
            }
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Negocio n : negocios) {
            Map<String, Object> item = new HashMap<>();
            item.put("negocio", n);
            item.put("sucursales", sucursalesPorNegocio.getOrDefault(n.getId(), List.of()));
            resultado.add(item);
        }

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/usuario/{id}")
    public List<Negocio> listarPorUsuario(@PathVariable("id") Long id) {
        return negocioRepository.findByIdUsuario(id);
    }

    @GetMapping("/publicos")
    public List<Negocio> listarPublicos() {
        return negocioRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarNegocio(@PathVariable Long id) {
        return negocioRepository.findById(id).map(negocio -> {
            negocioRepository.delete(negocio);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<?> actualizarEstadoNegocio(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean activo = body.get("activo");
        if (activo == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo activo es obligatorio."));
        }

        Negocio negocio = negocioRepository.findById(id).orElse(null);
        if (negocio == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Negocio no encontrado."));
        }

        negocio.setActivo(activo);
        return ResponseEntity.ok(negocioRepository.save(negocio));
    }
}
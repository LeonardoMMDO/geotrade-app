package com.geotrade.backend.controller;

import com.geotrade.backend.model.Negocio;
import com.geotrade.backend.repository.NegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import com.geotrade.backend.repository.SucursalRepository;
import java.util.HashMap;

@RestController
@RequestMapping("/api/negocios")
public class NegocioController {

    @Autowired
    private NegocioRepository negocioRepository;

    private final String UPLOAD_DIR = "/tmp/uploads/";

    // Agrega este @Autowired junto a los otros
    @Autowired
    private SucursalRepository sucursalRepository;

    @PostMapping(consumes = {"multipart/form-data"})
    public Negocio registrar(
            @RequestPart("negocio") Negocio negocio,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @RequestPart(value = "archivoIne", required = false) MultipartFile archivoIne) throws IOException {

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        if (archivos != null && !archivos.isEmpty()) {
            List<String> urls = new java.util.ArrayList<>();
            for (MultipartFile f : archivos) {
                if (f != null && !f.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + f.getOriginalFilename();
                    Files.copy(f.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
                    urls.add("/uploads/" + fileName);
                }
            }
            // store as comma-separated list
            negocio.setFotos_url_empresa(String.join(",", urls));
        }

        if (archivoIne != null && !archivoIne.isEmpty()) {
            String ineName = "INE_" + UUID.randomUUID().toString() + "_" + archivoIne.getOriginalFilename();
            Files.copy(archivoIne.getInputStream(), uploadPath.resolve(ineName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setIne_url_representante("/uploads/" + ineName);
        }

        return negocioRepository.save(negocio);
    }

    // Agrega este método junto a los otros endpoints
    @GetMapping("/publicos/con-sucursales")
    public ResponseEntity<?> listarPublicosConSucursales() {
        List<Negocio> negocios = negocioRepository.findAll();
        List<com.geotrade.backend.model.Sucursal> todasSucursales = sucursalRepository.findAll();

        Map<Long, List<com.geotrade.backend.model.Sucursal>> sucursalesPorNegocio = new HashMap<>();
        for (com.geotrade.backend.model.Sucursal s : todasSucursales) {
            Long idNegocio = s.getIdSucursal();  // ← si falla aquí, cambia por s.getNegocio().getId()
            if (idNegocio != null) {
                sucursalesPorNegocio
                    .computeIfAbsent(idNegocio, k -> new java.util.ArrayList<>())
                    .add(s);
            }
        }

        List<Map<String, Object>> resultado = new java.util.ArrayList<>();
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

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Negocio actualizar(
            @PathVariable Long id,
            @RequestPart("negocio") Negocio datosActualizados,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @RequestPart(value = "archivoIne", required = false) MultipartFile archivoIne) throws IOException {

        Negocio negocio = negocioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Negocio no encontrado"));

        negocio.setNombre_empresa(datosActualizados.getNombre_empresa());
        negocio.setCategoria_empresa(datosActualizados.getCategoria_empresa());
        negocio.setTelefono_empresa(datosActualizados.getTelefono_empresa());
        negocio.setDireccion_empresa(datosActualizados.getDireccion_empresa());
        negocio.setHorario_empresa(datosActualizados.getHorario_empresa());
        negocio.setCorreo_empresa(datosActualizados.getCorreo_empresa());
        negocio.setDescripcion_empresa(datosActualizados.getDescripcion_empresa());
        negocio.setLatitud(datosActualizados.getLatitud());
        negocio.setLongitud(datosActualizados.getLongitud());

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        if (archivos != null && !archivos.isEmpty()) {
            List<String> urls = new java.util.ArrayList<>();
            for (MultipartFile f : archivos) {
                if (f != null && !f.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + f.getOriginalFilename();
                    Files.copy(f.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
                    urls.add("/uploads/" + fileName);
                }
            }
            negocio.setFotos_url_empresa(String.join(",", urls));
        }

        if (archivoIne != null && !archivoIne.isEmpty()) {
            String ineName = "INE_" + UUID.randomUUID().toString() + "_" + archivoIne.getOriginalFilename();
            Files.copy(archivoIne.getInputStream(), uploadPath.resolve(ineName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setIne_url_representante("/uploads/" + ineName);
        }

        return negocioRepository.save(negocio);
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
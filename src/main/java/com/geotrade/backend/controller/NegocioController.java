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
import java.util.UUID;

@RestController
@RequestMapping("/api/negocios")
@CrossOrigin(origins = "http://localhost:4200")
public class NegocioController {

    @Autowired
    private NegocioRepository negocioRepository;

    private final String UPLOAD_DIR = "C:/geotrade/uploads/";

    @PostMapping(consumes = {"multipart/form-data"})
    public Negocio registrar(
            @RequestPart("negocio") Negocio negocio,
            @RequestPart(value = "archivo", required = false) MultipartFile archivo,
            @RequestPart(value = "archivoIne", required = false) MultipartFile archivoIne) throws IOException {

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        if (archivo != null && !archivo.isEmpty()) {
            String fileName = UUID.randomUUID().toString() + "_" + archivo.getOriginalFilename();
            Files.copy(archivo.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setFotos_url_empresa("/uploads/" + fileName);
        }

        if (archivoIne != null && !archivoIne.isEmpty()) {
            String ineName = "INE_" + UUID.randomUUID().toString() + "_" + archivoIne.getOriginalFilename();
            Files.copy(archivoIne.getInputStream(), uploadPath.resolve(ineName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setIne_url_representante("/uploads/" + ineName);
        }

        return negocioRepository.save(negocio);
    }

    @GetMapping("/usuario/{id}")
    public List<Negocio> listarPorUsuario(@PathVariable("id") Long id) {
        return negocioRepository.findByIdUsuario(id);
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
            @RequestPart(value = "archivo", required = false) MultipartFile archivo,
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

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        if (archivo != null && !archivo.isEmpty()) {
            String fileName = UUID.randomUUID().toString() + "_" + archivo.getOriginalFilename();
            Files.copy(archivo.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setFotos_url_empresa("/uploads/" + fileName);
        }

        if (archivoIne != null && !archivoIne.isEmpty()) {
            String ineName = "INE_" + UUID.randomUUID().toString() + "_" + archivoIne.getOriginalFilename();
            Files.copy(archivoIne.getInputStream(), uploadPath.resolve(ineName), StandardCopyOption.REPLACE_EXISTING);
            negocio.setIne_url_representante("/uploads/" + ineName);
        }

        return negocioRepository.save(negocio);
    }
}
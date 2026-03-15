package com.geotrade.backend.controller;

import com.geotrade.backend.model.Categoria;
import com.geotrade.backend.repository.CategoriaRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @PostConstruct
    public void asegurarCategoriasInicialesAlArranque() {
        inicializarCategoriasPorDefectoSiNoExisten();
    }

    @GetMapping
    public List<Categoria> listarCategorias() {
        inicializarCategoriasPorDefectoSiNoExisten();
        return categoriaRepository.findAllByOrderByIdAsc();
    }

    @PostMapping
    public ResponseEntity<?> crearCategoria(@RequestBody Categoria categoria) {
        String nombre = categoria.getNombre() != null ? categoria.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la categoría es obligatorio."));
        }

        if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Ya existe una categoría con ese nombre."));
        }

        Categoria nueva = new Categoria();
        nueva.setNombre(nombre);
        nueva.setIcono(valorSeguro(categoria.getIcono(), "bi-grid-fill"));
        nueva.setIconoMapa(valorSeguro(categoria.getIconoMapa(), "bi-geo-alt-fill"));
        nueva.setHabilitada(categoria.getHabilitada() == null ? true : categoria.getHabilitada());

        return ResponseEntity.ok(categoriaRepository.save(nueva));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCategoria(@PathVariable Long id, @RequestBody Categoria datos) {
        Categoria categoria = categoriaRepository.findById(id).orElse(null);
        if (categoria == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Categoría no encontrada."));
        }

        String nombre = datos.getNombre() != null ? datos.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la categoría es obligatorio."));
        }

        Categoria existente = categoriaRepository.findByNombreIgnoreCase(nombre).orElse(null);
        if (existente != null && !existente.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Ya existe una categoría con ese nombre."));
        }

        categoria.setNombre(nombre);
        categoria.setIcono(valorSeguro(datos.getIcono(), categoria.getIcono()));
        categoria.setIconoMapa(valorSeguro(datos.getIconoMapa(), categoria.getIconoMapa()));
        categoria.setHabilitada(datos.getHabilitada() == null ? categoria.getHabilitada() : datos.getHabilitada());

        return ResponseEntity.ok(categoriaRepository.save(categoria));
    }

    @PatchMapping("/{id}/habilitada")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean habilitada = body.get("habilitada");
        if (habilitada == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El estado habilitada es obligatorio."));
        }

        Categoria categoria = categoriaRepository.findById(id).orElse(null);
        if (categoria == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Categoría no encontrada."));
        }

        categoria.setHabilitada(habilitada);
        return ResponseEntity.ok(categoriaRepository.save(categoria));
    }

    private void inicializarCategoriasPorDefectoSiNoExisten() {
        if (categoriaRepository.count() > 0) {
            return;
        }

        List<Categoria> base = Arrays.asList(
            new Categoria("Restaurantes", "bi-cup-hot-fill", "bi-geo-alt-fill", true),
                new Categoria("Refaccionarias", "bi-car-front-fill", "bi-geo-alt-fill", true),
                new Categoria("Estética", "bi-scissors", "bi-geo-alt-fill", true),
                new Categoria("Abarrotes", "bi-cart", "bi-geo-alt-fill", true),
                new Categoria("Farmacias", "bi-capsule", "bi-geo-alt-fill", true),
                new Categoria("Gym", "bi-heart-pulse", "bi-geo-alt-fill", true),
                new Categoria("Florería", "bi-flower3", "bi-geo-alt-fill", true),
                new Categoria("Boutique", "bi-handbag", "bi-geo-alt-fill", true),
                new Categoria("Papelerías", "bi-book", "bi-geo-alt-fill", true),
                new Categoria("Veterinarias", "bi-hospital", "bi-geo-alt-fill", true)
        );

        categoriaRepository.saveAll(base);
    }

    private String valorSeguro(String valor, String fallback) {
        if (valor == null || valor.trim().isEmpty()) {
            return fallback;
        }
        return valor.trim();
    }
}

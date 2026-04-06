package com.geotrade.backend.controller;

import com.geotrade.backend.model.Negocio;
import com.geotrade.backend.model.Sucursal;
import com.geotrade.backend.repository.NegocioRepository;
import com.geotrade.backend.repository.SucursalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sucursales")
public class SucursalController {

    @Autowired
    private SucursalRepository sucursalRepository;

    @Autowired
    private NegocioRepository negocioRepository;

    public static class SucursalRequest {
        private Long idNegocio;
        private Double latitud;
        private Double longitud;
        private String direccion;

        public Long getIdNegocio() {
            return idNegocio;
        }

        public void setIdNegocio(Long idNegocio) {
            this.idNegocio = idNegocio;
        }

        public Double getLatitud() {
            return latitud;
        }

        public void setLatitud(Double latitud) {
            this.latitud = latitud;
        }

        public Double getLongitud() {
            return longitud;
        }

        public void setLongitud(Double longitud) {
            this.longitud = longitud;
        }

        public String getDireccion() {
            return direccion;
        }

        public void setDireccion(String direccion) {
            this.direccion = direccion;
        }
    }

    public static class SucursalResponse {
        private Long idSucursal;
        private Long idNegocio;
        private Double latitud;
        private Double longitud;
        private String direccion;

        public Long getIdSucursal() {
            return idSucursal;
        }

        public void setIdSucursal(Long idSucursal) {
            this.idSucursal = idSucursal;
        }

        public Long getIdNegocio() {
            return idNegocio;
        }

        public void setIdNegocio(Long idNegocio) {
            this.idNegocio = idNegocio;
        }

        public Double getLatitud() {
            return latitud;
        }

        public void setLatitud(Double latitud) {
            this.latitud = latitud;
        }

        public Double getLongitud() {
            return longitud;
        }

        public void setLongitud(Double longitud) {
            this.longitud = longitud;
        }

        public String getDireccion() {
            return direccion;
        }

        public void setDireccion(String direccion) {
            this.direccion = direccion;
        }
    }

    private SucursalResponse toResponse(Sucursal sucursal) {
        SucursalResponse response = new SucursalResponse();
        response.setIdSucursal(sucursal.getIdSucursal());
        response.setIdNegocio(sucursal.getNegocio().getId());
        response.setLatitud(sucursal.getLatitud());
        response.setLongitud(sucursal.getLongitud());
        response.setDireccion(sucursal.getDireccion());
        return response;
    }

    @GetMapping("/negocio/{idNegocio}")
    public List<SucursalResponse> getByNegocio(@PathVariable Long idNegocio) {
        return sucursalRepository.findByNegocio_IdOrderByIdSucursalAsc(idNegocio)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> crearSucursal(@RequestBody SucursalRequest request) {
        if (request.getIdNegocio() == null) {
            return ResponseEntity.badRequest().body("idNegocio es obligatorio");
        }
        if (request.getLatitud() == null || request.getLongitud() == null) {
            return ResponseEntity.badRequest().body("Latitud y longitud son obligatorias");
        }

        Optional<Negocio> negocioOpt = negocioRepository.findById(request.getIdNegocio());
        if (negocioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Negocio no encontrado");
        }

        Sucursal sucursal = new Sucursal();
        sucursal.setNegocio(negocioOpt.get());
        sucursal.setLatitud(request.getLatitud());
        sucursal.setLongitud(request.getLongitud());
        sucursal.setDireccion(request.getDireccion());

        Sucursal saved = sucursalRepository.save(sucursal);
        return ResponseEntity.ok(toResponse(saved));
    }
}

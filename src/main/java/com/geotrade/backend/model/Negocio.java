package com.geotrade.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "negocios")
public class Negocio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(name = "id_usuario")
    @JsonProperty("id_usuario") 
    private Long idUsuario;
    
    private String nombre_empresa;
    private String categoria_empresa;
    private String telefono_empresa;
    private String direccion_empresa;
    private String horario_empresa;
    private String correo_empresa;
    
    @Column(name = "ine_url_representante")
    @JsonProperty("ine_url_representante")
    private String ine_url_representante;
    
    @Column(columnDefinition = "TEXT")
    private String descripcion_empresa;
    
    @Column(name = "fotos_url_empresa", columnDefinition = "TEXT")
    @JsonProperty("fotos_url_empresa")
    private String fotos_url_empresa;

    public Negocio() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getId_usuario() { return idUsuario; }
    public void setId_usuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getNombre_empresa() { return nombre_empresa; }
    public void setNombre_empresa(String nombre_empresa) { this.nombre_empresa = nombre_empresa; }

    public String getCategoria_empresa() { return categoria_empresa; }
    public void setCategoria_empresa(String categoria_empresa) { this.categoria_empresa = categoria_empresa; }

    public String getTelefono_empresa() { return telefono_empresa; }
    public void setTelefono_empresa(String telefono_empresa) { this.telefono_empresa = telefono_empresa; }

    public String getDireccion_empresa() { return direccion_empresa; }
    public void setDireccion_empresa(String direccion_empresa) { this.direccion_empresa = direccion_empresa; }

    public String getHorario_empresa() { return horario_empresa; }
    public void setHorario_empresa(String horario_empresa) { this.horario_empresa = horario_empresa; }

    public String getCorreo_empresa() { return correo_empresa; }
    public void setCorreo_empresa(String correo_empresa) { this.correo_empresa = correo_empresa; }

    public String getDescripcion_empresa() { return descripcion_empresa; }
    public void setDescripcion_empresa(String descripcion_empresa) { this.descripcion_empresa = descripcion_empresa; }

    public String getFotos_url_empresa() { return fotos_url_empresa; }
    public void setFotos_url_empresa(String fotos_url_empresa) { this.fotos_url_empresa = fotos_url_empresa; }
    
    public String getIne_url_representante() { return ine_url_representante; }
    public void setIne_url_representante(String ine_url_representante) { this.ine_url_representante = ine_url_representante; }
}
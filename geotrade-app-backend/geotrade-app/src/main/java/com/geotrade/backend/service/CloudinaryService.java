package com.geotrade.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Sube un archivo a Cloudinary y retorna la URL segura (HTTPS)
     */
    @SuppressWarnings("rawtypes")
    public String uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        
        // El método upload recibe los bytes del archivo
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        
        // Retornamos la URL con HTTPS directo para evitar errores de Mixed Content
        return uploadResult.get("secure_url").toString();
    }
}
# Etapa 1: build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar todo
COPY . .

# 🔥 Ruta correcta al backend
WORKDIR /app/geotrade-app-backend/geotrade-app

# Compilar
RUN mvn clean package -DskipTests

# Etapa 2: ejecución
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copiar el jar generado
COPY --from=build /app/geotrade-app-backend/geotrade-app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
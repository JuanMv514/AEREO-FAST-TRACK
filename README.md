# AeroFastTrack — Sistema de Gestión de Operaciones Aéreas

AeroFastTrack es una aplicación web integral y profesional diseñada para la administración y control operativo de aerolíneas, ciudades, terminales aéreas, clientes, programación de vuelos y emisión de reservas con asignación de sillas en cabina.

El sistema fue concebido a partir de la documentación técnica **"Guía de desarrollo en equipo: Sistema Airlines-poo en Java (POO)"**, reflejando con exactitud todas sus reglas de negocio, relaciones y restricciones de integridad.

---

## 🛩️ Arquitectura del Sistema

La solución mantiene una estricta separación de responsabilidades en cuatro capas conceptuales, preparadas para su conexión con backend Java (JDBC/JPA/REST):

```
┌────────────────────────────────────────────────────────┐
│                      CAPA UI                           │
│   (Vistas modulares, Shell responsive, Modales, Toast) │
└──────────────────────────┬─────────────────────────────┘
                           │ invoca
┌──────────────────────────▼─────────────────────────────┐
│                   CAPA DE SERVICIOS                    │
│   (Reglas de negocio, Validaciones cruzadas, Reportes) │
└──────────────────────────┬─────────────────────────────┘
                           │ invoca
┌──────────────────────────▼─────────────────────────────┐
│                 CAPA DE REPOSITORIOS                   │
│   (Contrato Repository / Almacenamiento en Memoria)    │
└──────────────────────────┬─────────────────────────────┘
                           │ gestiona
┌──────────────────────────▼─────────────────────────────┐
│                     CAPA MODELO                        │
│   (Entidades de dominio, Objetos de valor, Validación) │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos Implementados

### 1. Clientes y Catálogos de Identificación
- **Países (`Country`)**: Identificador numérico positivo asignado, nombre único normalizado (máx. 20 caracteres).
- **Tipos de Documento (`DocumentType`)**: Identificador de exactamente 2 caracteres en mayúsculas (ej. `CC`, `TI`, `PA`, `CE`), descripción (máx. 20 caracteres).
- **Clientes (`Customer`)**: Documento de identidad único e inmutable (máx. 20), nombres y apellidos (máx. 30), teléfono validado con formato numérico y prefijo internacional opcional, correo electrónico único opcional, dirección opcional y asociaciones formales a país y tipo de documento.
- **Consultas avanzadas**: Búsqueda por apellido (coincidencia parcial sin mayúsculas), filtrado por país y tipo de documento, ordenamiento automático por apellido y nombre.

### 2. Ubicaciones (Ciudades y Aeropuertos)
- **Ciudades (`City`)**: Identificador autoincremental consecutivo (1, 1), nombre único insensible a mayúsculas y espacios (máx. 20 caracteres).
- **Aeropuertos (`Airport`)**: Identificador universal único (UUID v4), nombre del aeropuerto (máx. 50 caracteres) con restricción de unicidad dentro de la misma ciudad, y referencia obligatoria a la ciudad sede.

### 3. Flota de Aerolíneas
- **Aerolíneas (`Airline`)**: Identificador autoincremental que inicia en 100 y avanza de 10 en 10 (`100, 110, 120...`), nombre comercial único (máx. 50 caracteres).
- **Renombre seguro**: Validación de unicidad que permite conservar el propio nombre pero impide colisiones con terceros.

### 4. Vuelos y Reportes
- **Vuelos (`Flight`)**: Identificador numérico autoincremental, código de vuelo alfanumérico en mayúsculas único (máx. 8 caracteres), aeropuertos de origen y destino estrictamente distintos, fecha y hora de salida y llegada.
- **Lógica de tiempos**: Validación estricta que exige que la llegada sea posterior a la salida, con soporte completo para vuelos nocturnos que cruzan la medianoche y cálculo automático de duración en formato `X h Y min`.
- **Reporte Mensual (`uspVuelosPorAerolinea`)**: Consulta de vuelos agrupados por aerolínea en orden alfabético y orden cronológico por fecha/hora de salida.

### 5. Reservas, Pasajeros y Manifiesto
- **Silla (`Seat`)**: Objeto inmutable (Value Object) compuesto por fila (`1` a `12`) y posición de asiento (`A` a `F`), garantizando unicidad en cabina (ej. `12B`).
- **Detalle de Reserva (`ReservationDetail`)**: Composición de pasajeros con nombre completo (máx. 50), documento (máx. 20) y silla asignada.
- **Reservas (`Reservation`)**: Cliente titular, vuelo asociado y lista de 1 a 9 pasajeros.
- **Regla Central de Sillas**: Verificación en tiempo real de que ninguna silla sea asignada a dos pasajeros dentro del mismo vuelo a través de todas las reservas existentes.
- **Manifiesto de Vuelo**: Generación del manifiesto oficial de despacho con todos los pasajeros a bordo ordenados ascendentemente por código de silla.

---

## 🔒 Reglas de Integridad Referencial Cruzada
El sistema incluye bloqueos preventivos que reflejan el comportamiento de claves foráneas:
1. No es posible eliminar un país si existen clientes registrados asociados a él.
2. No es posible eliminar un tipo de documento si está asignado a clientes existentes.
3. No es posible eliminar una ciudad si cuenta con aeropuertos asignados.
4. No es posible eliminar un aeropuerto si tiene vuelos asignados (salida o llegada).
5. No es posible eliminar una aerolínea si tiene vuelos programados activos.
6. No es posible cancelar o eliminar un vuelo si tiene reservas con pasajeros activos.
7. No es posible eliminar un cliente si cuenta con reservas vigentes en el sistema.

---

## 💾 Persistencia Local y Guía de Sustentación (Etapa 2)
1. **Persistencia Desacoplada (LocalStorage)**:
   - Los repositorios implementan observadores reactivos que guardan el estado automáticamente ante cualquier inserción, actualización o eliminación.
   - Al recargar la página (`F5`), cerrar y reabrir el navegador, todos los clientes, vuelos y reservas creados por el usuario se conservan intactos.
   - El botón **`🔄 Reiniciar`** en el pie del menú lateral permite restablecer las semillas exactas de la guía en cualquier momento con un solo clic.
2. **Guía de Sustentación Punta a Punta**:
   - Sección en el menú lateral con el guion paso a paso documentado para la defensa y sustentación del proyecto (Ubicaciones ➔ Aerolíneas ➔ Vuelos ➔ Clientes ➔ Reservas ➔ Manifiesto ➔ Reporte Mensual ➔ Integridad Referencial).

---

## 🧪 Verificación y Casos de Prueba
El proyecto incluye un módulo interactivo en vivo y un archivo de pruebas (`test.html`) que ejecuta y certifica el 100% de los 29 casos de prueba definidos en la guía:

```bash
Total de pruebas: 29 | Pasaron: 29 (100%) | Fallaron: 0
```

---

## 🚀 Puesta en Marcha

1. Abra el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Opera, Safari).
2. En la pantalla inicial de demostración, seleccione el perfil de acceso deseado (**Agente de Operaciones** o **Administrador del Sistema**) y presione **Acceder al Panel de Control**.
3. Navegue entre los distintos módulos a través del menú lateral para consultar indicadores, registrar clientes, programar vuelos, seleccionar sillas en la cabina interactiva o emitir el manifiesto de vuelo.

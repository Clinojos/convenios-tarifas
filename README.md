# Manual de contratos - Clinojos

Sistema web de centralización y consulta de convenios para la Clínica de Ojos.

## Descripción General

Este proyecto tiene como objetivo eliminar la dependencia de archivos de Word en la gestión del Manual de Contratos y Convenios de la Clínica de Ojos. Actualmente, la información de tarifas, procedimientos y convenios con EPS se gestiona de forma aislada y redundante.

La solución consiste en desarrollar una plataforma web que se conecta directamente a la base de datos de HOSVITAL, permitiendo que la información sea consultable y gestionable en tiempo real, eliminando por completo la necesidad de llevar registros manuales paralelos.

## Problema Identificado

El flujo operativo actual presenta graves ineficiencias:

- **Doble carga laboral (Redundancia):** El encargado de actualizaciones debe registrar la misma información dos veces: primero en el sistema HOSVITAL y luego manualmente en un documento de Word.
- **Ineficiencia en la consulta:** El personal administrativo debe navegar por un documento de Word extremadamente extenso para buscar datos específicos, lo cual es un proceso lento, tedioso y propenso a errores humanos.
- **Desfase de información:** Al existir dos fuentes distintas, la información en el archivo de Word suele quedar desactualizada respecto a la base de datos real de HOSVITAL, lo que genera errores en la atención y facturación.

## Propuesta de Solución

Desarrollo de una aplicación web centralizada que actúa como una interfaz inteligente sobre la base de datos existente:

- **Eliminación del proceso manual:** Se elimina definitivamente el archivo de Word. El sistema toma la información directamente de la fuente oficial (HOSVITAL).
- **Parametrización eficiente:** La plataforma permite gestionar convenios, tarifas y servicios de manera dinámica, facilitando que los cambios realizados en la base de datos sean visibles instantáneamente para todo el personal.
- **Consulta Inteligente:** Se implementa un motor de búsqueda avanzado que permite al administrativo filtrar por EPS, tipo de procedimiento o convenio, obteniendo resultados precisos en segundos.

## Estructura del Proyecto

```text
contract-hosvital/
├── backend/          # API con FastAPI
├── frontend/         # Interfaz con Next.js
├── database/         # Scripts SQL y esquemas de base de datos
└── README.md         # Documentación del proyecto
```

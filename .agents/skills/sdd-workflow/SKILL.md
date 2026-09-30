---
name: sdd-workflow
description: >-
  Workflow especializado en Spec-Driven Development (SDD) y control de calidad asistido por IA,
  inspirado en GitHub Spec-Kit y Superpowers Basic Workflow. Úsalo para planificar, validar
  contratos y ejecutar tareas de forma atómica y trazable.
---

# SDD Workflow Skill (Spec-Driven Development & Superpowers)

Esta habilidad proporciona el protocolo estricto para desarrollar componentes de software sin desviaciones, garantizando trazabilidad y calidad técnica.

## Flujo de Trabajo Operativo

### Fase 1: Especificar (Specify)
- Ubicación: `specs/01-specification.md`
- Define:
  1. Problema de negocio y valor aportado.
  2. Actores y casos de uso principales.
  3. Glosario de dominio (Edificio, Zona, Contador, Lectura, Potencia activa/reactiva, Alerta, Ticket).
  4. Criterios de aceptación (Gherkin o checklist de comportamiento esperado).

### Fase 2: Diseñar Contratos (Plan / Contracts)
- Ubicación: `specs/02-architecture-contracts.md`
- Define:
  1. Modelo de base de datos relacional (tablas, campos, relaciones, índices).
  2. Esquemas Pydantic / DTOs (Request / Response).
  3. Contratos de API REST (Método, Ruta, Parámetros, Códigos HTTP, Errores).
  4. Tipos TypeScript coincidentes para el frontend.

### Fase 3: Desglose Atómico (Task Breakdown)
- Ubicación: `specs/03-task-breakdown.md`
- Cada tarea debe tener:
  - ID único (ej. `TASK-01`, `TASK-02`).
  - Ruta de archivos afectados.
  - Criterio de verificación medible (ej. test `pytest tests/test_ingestion.py` en verde).
  - Estado: `[ ] Pendiente`, `[/] En progreso`, `[x] Completada`.

### Fase 4: Implementación y TDD (Implement & Verify)
- Por cada tarea:
  1. Escribir o actualizar test unitario representativo.
  2. Implementar la solución mínima que satisfaga el contrato.
  3. Ejecutar suite de pruebas: verificar que no haya regresiones.
  4. Marcar tarea completada en `specs/03-task-breakdown.md`.

### Fase 5: Convergencia y Documentación
- Validar integración extremo a extremo.
- Actualizar `README.md` con ejemplos de llamadas cURL, capturas y métricas de rendimiento.

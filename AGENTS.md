# AGENTS.md - SyncroHub Platform Engineering & AI Rules

Este archivo define las directrices obligatorias para cualquier agente o desarrollador que trabaje en este repositorio, implementando las metodologías **Spec-Driven Development (GitHub Spec-Kit)** y **The Basic Workflow (Superpowers)**.

---

## 1. Principio Fundamental: Spec-Driven Development (SDD)
* **Cero "Vibe Coding":** No se crea código nuevo ni se modifican contratos de API sin que exista una especificación previa en la carpeta `specs/`.
* **Fuente de verdad:** Toda decisión de diseño arquitectónico, modelos de datos y endpoints debe estar reflejada en `specs/01-specification.md` y `specs/02-architecture-contracts.md`.
* **Trazabilidad:** Cada Pull Request, commit o tarea debe asociarse a un ítem concreto de `specs/03-task-breakdown.md`.

## 2. Ciclo de Trabajo Requerido (The Basic Workflow)
1. **Brainstorm / Specification:** Validar el objetivo, entidades y casos de uso en `specs/`.
2. **Architecture & Contracts:** Definir esquemas de datos (Pydantic / SQLModel / TypeScript interfaces) antes de implementar la lógica.
3. **Task Breakdown:** Desglosar en tareas atómicas verificables (2-5 min de ejecución).
4. **Implementación TDD & Verificación:** 
   * Escribir pruebas unitarias/integración para la lógica de negocio (cálculo de potencia, facturación, detección de anomalías).
   * Ejecutar y verificar que los tests pasen antes de dar la tarea por concluida.
5. **Revisión y Documentación:** Mantener `README.md` y especificaciones al día.

## 3. Estándares Técnicos
* **Backend:**
  * Python 3.10+, FastAPI, Pydantic v2, SQLModel/SQLAlchemy.
  * Tipado estricto en todas las funciones y endpoints (`mypy` / annotations).
  * Documentación OpenAPI limpia (`summary`, `description`, `response_model` en cada ruta).
* **Frontend:**
  * React + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts.
  * Componentes modulares, desacoplados de la capa de API mediante servicios/hooks.
* **Entornos y Reproducibilidad:**
  * Gestión de entorno Python mediante `uv`.
  * Todo el stack debe ser ejecutable mediante `docker-compose up`.
* **Gestión de Recursos y Contexto:**
  * No verter volcados masivos en el chat.
  * Mantener archivos pequeños y modulares (< 250 líneas por archivo siempre que sea posible).

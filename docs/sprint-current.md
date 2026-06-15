# Sprint 6 — Biblioteca de Contenido (Base)

## Checklist
- [x] ADR-006 — módulo de biblioteca de contenido
- [x] Migración: tablas content_categories, content_items, content_files + RLS + Storage bucket
- [x] Seed: 12 categorías por defecto (editables/borrables desde UI)
- [x] Zod schemas en lib/validations/content.ts
- [x] Interfaces IContentCategoryRepository, IContentItemRepository, IContentFileRepository
- [x] Implementaciones ContentCategoryRepository, ContentItemRepository, ContentFileRepository
- [x] ContentService con CRUD de categorías, items y archivos
- [ ] /contenido — sidebar de categorías + tabla de items por marca
- [ ] Vista de items agrupada por business_unit con conteo de archivos
- [ ] Preview: imagen inline, PDF embed, YouTube player, descarga directa
- [ ] Upload de archivos (drag & drop, límite 200 MB)
- [ ] Pegar URL de YouTube
- [ ] CRUD de categorías desde UI (solo marketing / director_general)
- [ ] CRUD de items desde UI

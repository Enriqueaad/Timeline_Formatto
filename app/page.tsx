export default function Home() {
  return (
    <>
      <div className="header">
        <div className="logo-wrap">
          <svg className="logo-svg" viewBox="0 0 1445.1 236.12" xmlns="http://www.w3.org/2000/svg" aria-label="Formatto">
            <rect fill="#CE4620" x="1369.32" y="157.01" width="75.78" height="75.78" />
            <path fill="#010101" d="M48.93,146.08c0-13.64-10.61-23.62-24.63-23.62H0V91.2H21.9c15.4,0,27-11.31,27-26.27,0-30.6,25-53.54,58.18-53.54h27.37V42.31H108.13c-14.71,0-25,11-25,24.62s10.27,24.27,25,24.27h26.35v31.26h-27c-14,0-24.3,10-24.3,23.62v98.1H48.93Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M490.6,244.18V150.73c0-16.29,13.69-29.6,30.12-29.6a29.81,29.81,0,0,1,30.11,29.6v93.45h34.22V150.73c0-16.29,13.69-29.6,30.11-29.6a29.81,29.81,0,0,1,30.12,29.6v93.45H679.5V150.73c0-17.62-5.82-32.26-17.8-43.23S634,91.2,615.16,91.2H456.38v153Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M1138.13,91.2c-16.08,0-28.06-11.64-28.06-27.27V34.66h-34.22V63.93c0,15.63-12,27.27-28.06,27.27h-37.33c-16.08,0-28.06-11.64-28.06-27.27V34.66H948.18V63.93c0,15.63-12,27.27-28.06,27.27h-26v31.26h26c16.08,0,28.06,11.64,28.06,27.27v94.45H982.4V149.73c0-15.63,12-27.27,28.06-27.27h37.33c16.08,0,28.06,11.64,28.06,27.27v94.45h34.22V149.73c0-15.63,12-27.27,28.06-27.27h25.66V91.2Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M230.57,87.88h-.69a85.47,85.47,0,0,0-41.74,10.64c-25.67,14.3-41.41,39.91-41.41,69.17A75.29,75.29,0,0,0,158,207.93c14.71,24.28,41.74,39.58,71.85,39.58h.69c46.2,0,83.15-35.59,83.15-79.82S276.77,87.88,230.57,87.88Zm0,126.37h-.69c-26.34,0-47.56-21.28-47.56-46.56,0-25.94,21.22-46.56,47.56-46.56h.69c26.35,0,47.57,21.28,47.57,46.56C278.14,192.64,256.92,214.25,230.57,214.25Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M705.73,167.69c0,41.9,35.58,76.49,79.73,76.49h78V91.2h-78C741.31,91.2,705.73,125.79,705.73,167.69Zm124.56,0c0,23.61-20.19,43.9-44.49,43.9s-44.49-20.29-44.49-43.9c0-23.94,20.19-43.9,44.49-43.9S830.29,143.41,830.29,167.69Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M1258.82,87.88h-.69a85.51,85.51,0,0,0-41.75,10.64c-25.66,14.3-41.4,39.91-41.4,69.17a75.37,75.37,0,0,0,11.29,40.24c14.72,24.28,41.75,39.58,71.86,39.58h.69c46.19,0,83.15-35.59,83.15-79.82S1305,87.88,1258.82,87.88Zm0,126.37h-.69c-26.34,0-47.56-21.28-47.56-46.56,0-25.94,21.22-46.56,47.56-46.56h.69c26.35,0,47.57,21.28,47.57,46.56C1306.39,192.64,1285.17,214.25,1258.82,214.25Z" transform="translate(0 -11.39)" />
            <path fill="#010101" d="M424.18,91.21H340.69v153H374.9V147.76c0-14.32,11.29-25,26.36-25.3h24.49V91.21Z" transform="translate(0 -11.39)" />
          </svg>
          <span className="doc-title">Dotacion de Personal · Asignacion de Obras</span>
        </div>
        <div className="header-meta">Actualizacion: 27 Mayo 2026<br />Jefatura de Instalaciones</div>
      </div>

      <div className="kpi-bar" id="kpiBar" />

      <div className="tabs">
        <div className="tab active" data-tab="Timeline">Timeline</div>
        <div className="tab" data-tab="Costo">Costo Proyectado</div>
        <div className="tab" data-tab="Eval">Evaluacion Personal</div>
        <button className="admin-btn" id="adminOpenBtn" type="button">Admin</button>
        <div className="admin-session" id="adminSessionChip">
          <span id="adminGreeting">Hola Enrique</span>
          <button className="admin-session-logout" id="globalLogoutBtn" type="button">Cerrar sesion</button>
        </div>
      </div>

      <div className="filter-bar" id="filterBar">
        <span className="ctrl-label">Obra</span>
        <div className="ms-wrap" id="msWrapObra">
          <button className="ms-btn" id="msBtnObra" type="button">Todas <span className="ms-arrow">▼</span></button>
          <div className="ms-dropdown" id="msDDObra" />
        </div>
        <span className="ctrl-label">Supervisor</span>
        <div className="ms-wrap" id="msWrapSup">
          <button className="ms-btn" id="msBtnSup" type="button">Todos <span className="ms-arrow">▼</span></button>
          <div className="ms-dropdown" id="msDDSup" />
        </div>
        <span className="ctrl-label">Estado</span>
        <div className="ms-wrap" id="msWrapEst">
          <button className="ms-btn" id="msBtnEst" type="button">Todos <span className="ms-arrow">▼</span></button>
          <div className="ms-dropdown" id="msDDEst" />
        </div>
        <div id="vistaControls" style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
          <span className="ctrl-label">Capas</span>
          <div className="toggle-group">
            <button className="toggle-btn active" id="btnLayerDot" type="button">Dotacion</button>
            <button className="toggle-btn" id="btnLayerCos" type="button">Costo</button>
            <button className="toggle-btn" id="btnLayerSub" type="button">Subcontrato</button>
          </div>
        </div>
        <div className="legend" id="tlLegend" />
      </div>

      <div className="panel active" id="panelTimeline">
        <div className="timeline-scroll"><div className="tl-grid" id="tlGrid" /></div>
        <div className="sub-panel">
          <div className="sub-header">Subcontratos Activos</div>
          <div className="sub-list" id="subList" />
          <div className="sub-total">
            <span className="sub-total-label">Total Sub.</span>
            <span className="sub-total-val" id="subTotalVal" />
          </div>
        </div>
      </div>

      <div className="panel" id="panelCosto">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100vh - 220px)" }}>
          <div className="costo-filters" id="costoFilters">
            <span className="ctrl-label">Rango Meses</span>
            <div className="range-wrap">
              <span style={{ fontSize: 9, color: "var(--bark)" }}>Desde</span>
              <select id="rangeDesde" />
              <span style={{ fontSize: 9, color: "var(--bark)" }}>Hasta</span>
              <select id="rangeHasta" />
            </div>
          </div>
          <div className="costo-inner" id="costoInner" />
        </div>
      </div>

      <div className="panel" id="panelEval">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="eval-sticky-header" id="evalStickyHeader">
            <div className="eval-legend-bar">
              <div className="ev-leg"><div className="ev-leg-dot" style={{ background: "var(--ev-MB)" }} />MB - Muy Bueno</div>
              <div className="ev-leg"><div className="ev-leg-dot" style={{ background: "var(--ev-B)" }} />B - Bueno</div>
              <div className="ev-leg"><div className="ev-leg-dot" style={{ background: "var(--ev-R)" }} />R - Regular</div>
              <div className="ev-leg"><div className="ev-leg-dot" style={{ background: "var(--ev-M)" }} />M - Malo</div>
            </div>
            <div className="eval-resumen-bar" id="evalResumenBar" />
          </div>
          <div className="eval-scroll" id="evalScroll"><div className="eval-cards-grid" id="evalCardsGrid" /></div>
        </div>
      </div>

      <div className="tooltip" id="tooltip"><div className="tt-title" id="ttTitle" /><div id="ttBody" /></div>

      <div className="modal-overlay" id="modalOverlay">
        <div className="modal">
          <div className="modal-header">
            <div><div className="modal-title" id="modalTitle" /><div className="modal-subtitle" id="modalSubtitle" /></div>
            <div className="modal-close" id="modalCloseBtn">×</div>
          </div>
          <div id="modalBody" />
        </div>
      </div>

      <aside className="admin-panel" id="adminPanel">
        <div className="admin-head">
          <div>
            <div className="admin-title">CRUD Formatto</div>
            <div className="admin-subtitle" id="adminMode">Conectando datos...</div>
          </div>
          <button className="admin-close" id="adminCloseBtn" type="button">×</button>
        </div>
        <div className="admin-body">
          <div className="admin-card">
            <div className="admin-card-title">Sesion admin</div>
            <div className="admin-row">
              <div className="admin-field"><label>Email</label><input id="adminEmail" type="email" placeholder="admin@formatto.cl" /></div>
              <div className="admin-field"><label>Password</label><input id="adminPassword" type="password" placeholder="••••••••" /></div>
            </div>
            <div className="admin-actions">
              <button className="admin-btn" id="adminLoginBtn" type="button">Entrar</button>
              <button className="admin-btn secondary" id="adminLogoutBtn" type="button">Salir</button>
            </div>
            <div className="admin-status" id="adminAuthStatus">Configura Supabase para activar login y escritura.</div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Obra</div>
            <div className="admin-row">
              <div className="admin-field"><label>Nombre</label><input id="obraNombre" /></div>
              <div className="admin-field"><label>Supervisor</label><input id="obraSupervisor" /></div>
              <div className="admin-field"><label>Estado</label><select id="obraEstado"><option>PROCESO</option><option>CIERRE</option><option>PILOTO</option><option>DESARROLLO</option><option>SUBCONTRATO</option></select></div>
              <div className="admin-field"><label>Fin</label><input id="obraFin" type="date" /></div>
            </div>
            <div className="admin-actions">
              <button className="admin-btn" id="saveObraBtn" type="button">Guardar obra</button>
              <button className="admin-btn secondary" id="deleteObraBtn" type="button">Eliminar</button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Personal</div>
            <div className="admin-row">
              <div className="admin-field"><label>Obra</label><input id="personaObra" /></div>
              <div className="admin-field"><label>Nombre</label><input id="personaNombre" /></div>
              <div className="admin-field"><label>Cargo</label><input id="personaCargo" /></div>
              <div className="admin-field"><label>Supervisor</label><input id="personaSupervisor" /></div>
              <div className="admin-field"><label>Cant.</label><input id="personaCant" type="number" min="0" step="1" defaultValue="1" /></div>
              <div className="admin-field"><label>Costo</label><input id="personaCosto" type="number" min="0" step="1" /></div>
              <div className="admin-field"><label>Eval</label><select id="personaEval"><option>MB</option><option>B</option><option>R</option><option>M</option></select></div>
              <div className="admin-field"><label>Fin</label><input id="personaFin" type="date" /></div>
              <div className="admin-field"><label>Desde</label><input id="personaDesde" type="date" /></div>
            </div>
            <div className="admin-actions"><button className="admin-btn" id="savePersonaBtn" type="button">Agregar personal</button></div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Asignacion de personal</div>
            <div className="admin-row">
              <div className="admin-field"><label>Buscar</label><input id="assignmentSearch" placeholder="Nombre, cargo o supervisor" /></div>
              <div className="admin-field"><label>Obra</label><select id="assignmentObraFilter"><option value="">Todas</option></select></div>
              <div className="admin-field"><label>Fecha efectiva</label><input id="assignmentDate" type="date" /></div>
              <div className="admin-field"><label>Destino</label><select id="assignmentTargetSelect"><option value="">Arrastra o elige destino</option></select></div>
            </div>
            <div className="assignment-board" id="assignmentBoard" />
            <div className="assignment-confirm" id="assignmentConfirm">
              <div className="assignment-confirm-title">Confirmar movimiento</div>
              <div className="assignment-confirm-copy" id="assignmentConfirmCopy">Arrastra un trabajador a otra obra para preparar el cambio.</div>
              <div className="admin-row">
                <div className="admin-field"><label>Supervisor destino</label><input id="assignmentSupervisor" /></div>
                <div className="admin-field"><label>Fecha efectiva</label><input id="assignmentConfirmDate" type="date" /></div>
              </div>
              <div className="admin-actions">
                <button className="admin-btn" id="assignmentSaveBtn" type="button">Confirmar</button>
                <button className="admin-btn secondary" id="assignmentCancelBtn" type="button">Cancelar</button>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Subcontrato</div>
            <div className="admin-row">
              <div className="admin-field"><label>Obra</label><input id="subObra" /></div>
              <div className="admin-field"><label>Nombre</label><input id="subNombre" /></div>
              <div className="admin-field"><label>Cant.</label><input id="subCant" type="number" min="0" step="1" /></div>
              <div className="admin-field"><label>Fin</label><input id="subFin" type="date" /></div>
            </div>
            <div className="admin-actions"><button className="admin-btn" id="saveSubBtn" type="button">Guardar sub</button></div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Importar Excel</div>
            <div className="admin-field"><label>Archivo .xlsx</label><input id="excelFile" type="file" accept=".xlsx,.xls,.csv" /></div>
            <div className="admin-actions" style={{ marginTop: 8 }}><button className="admin-btn secondary" id="previewExcelBtn" type="button">Vista previa</button></div>
            <div className="admin-preview" id="excelPreview">La importacion muestra resumen antes de escribir en Supabase.</div>
          </div>
        </div>
      </aside>
    </>
  );
}

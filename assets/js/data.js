// ── DATA ──────────────────────────────────────────────────────────────────
let TIMELINE_CONFIG = window.TIMELINE_CONFIG || {cutoffDate:'2026-05-27'};
function parseLocalDate(isoDate){
  const [year,month,day]=isoDate.split('-').map(Number);
  return new Date(year,month-1,day);
}
let TODAY = parseLocalDate(TIMELINE_CONFIG.cutoffDate);
const MNAMES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

const ESTADOS_MAP = {
  'CHICAUMA 9.1':       {estado:'PROCESO',fin:new Date(2026,6,1)},
  'LOS CIPRESES':       {estado:'PROCESO',fin:new Date(2026,8,30)},
  'V.P.PEÑALOLEN':      {estado:'CIERRE', fin:new Date(2026,5,30)},
  'LOS SAUCES':         {estado:'PROCESO',fin:new Date(2026,8,30)},
  'MAGNOLIA':           {estado:'PROCESO',fin:new Date(2026,10,30)},
  'PAULISTA III':       {estado:'PILOTO', fin:new Date(2026,11,31)},
  'PUERTA FLORIDA':     {estado:'CIERRE', fin:new Date(2026,5,30)},
  'PUNTAS GRUESA':      {estado:'PROCESO',fin:new Date(2026,5,30)},
  'SOLANA MARBELLA':    {estado:'PROCESO',fin:new Date(2026,8,15)},
  'TASCO':              {estado:'PROCESO',fin:new Date(2026,7,30)},
  'VIENTO NORTE A1-A2': {estado:'PROCESO',fin:new Date(2026,5,30)},
  'VIENTO NORTE B3-B4': {estado:'PROCESO',fin:new Date(2026,6,30)},
  'VM3':                {estado:'PROCESO',fin:new Date(2026,7,30)},
  'VISTA AGUILA':       {estado:'SUBCONTRATO',fin:new Date(2026,6,15)},
};

const PERSONAL = [
  {nombre:'Julio Sebastian Godoy',  cargo:'INSTALADOR',  obra:'CHICAUMA 9.1',       cant:1,costo:1100854,eval:'MB',supervisor:'Jose',    fin:new Date(2026,6,1)},
  {nombre:'Juan Pablo Calderon',    cargo:'INSTALADOR',  obra:'LOS CIPRESES',       cant:1,costo:1430620,eval:'MB',supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Lisaned Contreras',      cargo:'REMATADOR',   obra:'LOS CIPRESES',       cant:1,costo:962812, eval:'R', supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Ricardo Gomez',          cargo:'INSTALADOR',  obra:'LOS CIPRESES',       cant:1,costo:1115854,eval:'B', supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Solange Salazar',        cargo:'REMATADOR',   obra:'V.P.PEÑALOLEN',      cant:1,costo:927500, eval:'MB',supervisor:'Robinson',fin:new Date(2026,5,30)},
  {nombre:'Carlos Torres',          cargo:'AYUD. INST.', obra:'LOS CIPRESES',       cant:1,costo:924450, eval:'MB',supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Viviana Valdes',         cargo:'REMATADOR',   obra:'LOS CIPRESES',       cant:1,costo:939101, eval:'B', supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Hector Vasquez',         cargo:'INSTALADOR',  obra:'LOS CIPRESES',       cant:1,costo:1614934,eval:'MB',supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Luis Norin',             cargo:'INSTALADOR',  obra:'LOS CIPRESES',       cant:1,costo:1115854,eval:'MB',supervisor:'Jose',    fin:new Date(2026,8,30)},
  {nombre:'Osvaldo Salinas',        cargo:'INSTALADOR',  obra:'V.P.PEÑALOLEN',      cant:1,costo:1303354,eval:'MB',supervisor:'Robinson',fin:new Date(2026,5,30)},
  {nombre:'Raul Tapia',             cargo:'INSTALADOR',  obra:'LOS SAUCES',         cant:1,costo:1079000,eval:'B', supervisor:'Ana',     fin:new Date(2026,8,30)},
  {nombre:'Pablo Vargas',           cargo:'INSTALADOR',  obra:'MAGNOLIA',           cant:1,costo:1240854,eval:'B', supervisor:'Ana',     fin:new Date(2026,10,30)},
  {nombre:'Juan Cancino',           cargo:'REMATADOR',   obra:'V.P.PEÑALOLEN',      cant:1,costo:931250, eval:'B', supervisor:'Robinson',fin:new Date(2026,5,30)},
  {nombre:'Jose Ramiro',            cargo:'REMATADOR',   obra:'PUERTA FLORIDA',     cant:1,costo:1415897,eval:'B', supervisor:'Marcos',  fin:new Date(2026,5,30)},
  {nombre:'Jose Fernandez',         cargo:'INSTALADOR',  obra:'LOS SAUCES',         cant:1,costo:1100354,eval:'B', supervisor:'Ana',     fin:new Date(2026,8,30)},
  {nombre:'Patricio Gonzalez',      cargo:'INSTALADOR',  obra:'VIENTO NORTE A1-A2', cant:1,costo:752084, eval:'R', supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Marcelo Oliveros',       cargo:'INSTALADOR',  obra:'PUNTAS GRUESA',      cant:1,costo:744750, eval:'B', supervisor:'Jose',    fin:new Date(2026,5,30)},
  {nombre:'Jose Silva',             cargo:'INSTALADOR',  obra:'MAGNOLIA',           cant:1,costo:745000, eval:'R', supervisor:'Ana',     fin:new Date(2026,10,30)},
  {nombre:'Hector Mejias',          cargo:'INSTALADOR',  obra:'SOLANA MARBELLA',    cant:1,costo:1171660,eval:'B', supervisor:'Marcos',  fin:new Date(2026,8,15)},
  {nombre:'Benito Vilches',         cargo:'INSTALADOR',  obra:'SOLANA MARBELLA',    cant:1,costo:1305146,eval:'MB',supervisor:'Marcos',  fin:new Date(2026,8,15)},
  {nombre:'Marco Cayupil',          cargo:'INSTALADOR',  obra:'MAGNOLIA',           cant:1,costo:1352224,eval:'MB',supervisor:'Ana',     fin:new Date(2026,10,30)},
  {nombre:'Francisco Pastene',      cargo:'INSTALADOR',  obra:'TASCO',              cant:1,costo:747500, eval:'B', supervisor:'Ana',     fin:new Date(2026,7,30)},
  {nombre:'Ramiro Irribarra',       cargo:'INSTALADOR',  obra:'SOLANA MARBELLA',    cant:1,costo:1115854,eval:'B', supervisor:'Marcos',  fin:new Date(2026,8,15)},
  {nombre:'Gabriel Lagos',          cargo:'INSTALADOR',  obra:'PUERTA FLORIDA',     cant:1,costo:1115854,eval:'B', supervisor:'Marcos',  fin:new Date(2026,5,30)},
  {nombre:'Hernan Muñoz',           cargo:'INSTALADOR',  obra:'PAULISTA III',       cant:1,costo:1594005,eval:'MB',supervisor:'Pablo',   fin:new Date(2026,11,31)},
  {nombre:'Persona 2',        cargo:'INSTALADOR',  obra:'PAULISTA III',       cant:1,costo:1100000,eval:'B', supervisor:'Pablo',   fin:new Date(2026,11,31),desde:new Date(2026,6,1)},
  {nombre:'Persona 3',        cargo:'INSTALADOR',  obra:'PAULISTA III',       cant:1,costo:1100000,eval:'B', supervisor:'Pablo',   fin:new Date(2026,11,31),desde:new Date(2026,6,1)},
  {nombre:'Persona 4',        cargo:'INSTALADOR',  obra:'PAULISTA III',       cant:1,costo:1100000,eval:'B', supervisor:'Pablo',   fin:new Date(2026,11,31),desde:new Date(2026,6,1)},
  {nombre:'Sergio Castillo',        cargo:'INSTALADOR',  obra:'VIENTO NORTE A1-A2', cant:1,costo:1076854,eval:'M', supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Franco Bolbaran',        cargo:'DIST. MBL',   obra:'VIENTO NORTE B3-B4', cant:1,costo:806562, eval:'B', supervisor:'Luis',    fin:new Date(2026,6,30)},
  {nombre:'Raul Oliveros',          cargo:'INSTALADOR',  obra:'VIENTO NORTE B3-B4', cant:1,costo:1115854,eval:'MB',supervisor:'Luis',    fin:new Date(2026,6,30)},
  {nombre:'Manuel Salinas',         cargo:'INSTALADOR',  obra:'VIENTO NORTE B3-B4', cant:1,costo:1115854,eval:'MB',supervisor:'Luis',    fin:new Date(2026,6,30)},
  {nombre:'Ricardo Vera',           cargo:'INSTALADOR',  obra:'VIENTO NORTE A1-A2', cant:1,costo:1115854,eval:'MB',supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Pablo Cruz',             cargo:'INSTALADOR',  obra:'VIENTO NORTE A1-A2', cant:1,costo:737344, eval:'M', supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Alan Bazan',             cargo:'INSTALADOR',  obra:'VM3',                cant:1,costo:1091104,eval:'B', supervisor:'Marcos',  fin:new Date(2026,7,30)},
  {nombre:'Kerado Geneus',          cargo:'INSTALADOR',  obra:'VM3',                cant:1,costo:1108754,eval:'MB',supervisor:'Marcos',  fin:new Date(2026,7,30)},
  {nombre:'Sergio A. Muñoz',        cargo:'INSTALADOR',  obra:'VM3',                cant:1,costo:1115854,eval:'B', supervisor:'Marcos',  fin:new Date(2026,7,30)},
  {nombre:'Sergio E. Muñoz',        cargo:'INSTALADOR',  obra:'VM3',                cant:1,costo:1115854,eval:'B', supervisor:'Marcos',  fin:new Date(2026,7,30)},
  {nombre:'Jose Valdes',            cargo:'INSTALADOR',  obra:'LOS SAUCES',         cant:1,costo:1079000,eval:'B', supervisor:'Ana',     fin:new Date(2026,8,30)},
  {nombre:'Adolfo Burgos',          cargo:'INSTALADOR',  obra:'LOS SAUCES',         cant:1,costo:1079000,eval:'B', supervisor:'Ana',     fin:new Date(2026,8,30)},
  {nombre:'Alexander Maturana',     cargo:'INSTALADOR',  obra:'SOLANA MARBELLA',    cant:1,costo:1079000,eval:'B', supervisor:'Marcos',  fin:new Date(2026,8,15)},
  {nombre:'Victor Arriagada',       cargo:'INSTALADOR',  obra:'TASCO',              cant:1,costo:1079000,eval:'B', supervisor:'Ana',     fin:new Date(2026,7,30)},
  {nombre:'Fernando Ceballos',      cargo:'INSTALADOR',  obra:'VIENTO NORTE A1-A2', cant:1,costo:1079000,eval:'R', supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Martin Ponce',           cargo:'DIST. MBL',   obra:'VIENTO NORTE A1-A2', cant:1,costo:1079000,eval:'B', supervisor:'Pablo',   fin:new Date(2026,5,30)},
  {nombre:'Carolina Araya',         cargo:'INSTALADOR',  obra:'TASCO',              cant:1,costo:1079000,eval:'B', supervisor:'Ana',     fin:new Date(2026,7,30)},
  {nombre:'Miguel Aravena',         cargo:'INSTALADOR',  obra:'TASCO',              cant:1,costo:1079000,eval:'R', supervisor:'Ana',     fin:new Date(2026,7,30)},
  {nombre:'Ignacio Salinas',        cargo:'REMATADOR',   obra:'VIENTO NORTE B3-B4', cant:1,costo:1079000,eval:'B', supervisor:'Luis',    fin:new Date(2026,6,30)},
  {nombre:'Elizabeth Salazar',      cargo:'REMATADOR',   obra:'V.P.PEÑALOLEN',      cant:1,costo:1079000,eval:'B', supervisor:'Robinson',fin:new Date(2026,5,30)},
];

const SUBCONTRATOS = [
  {obra:'CHICAUMA 9.1',       nombre:'Carlos Cassal',  cant:2,fin:new Date(2026,6,1)},
  {obra:'LOS CIPRESES',       nombre:'Pedro Figeroa',  cant:0,fin:new Date(2026,8,30)},
  {obra:'PUNTAS GRUESA',      nombre:'Mueble Gava',    cant:3,fin:new Date(2026,5,30)},
  {obra:'V.P.PEÑALOLEN',      nombre:'Alex Balletoro', cant:0,fin:new Date(2026,5,30)},
  {obra:'VIENTO NORTE A1-A2', nombre:'Jose Carrizo',   cant:3,fin:new Date(2026,5,30)},
  {obra:'VIENTO NORTE B3-B4', nombre:'Pedro Figeroa',  cant:5,fin:new Date(2026,6,30)},
  {obra:'VISTA AGUILA',       nombre:'Felipe Aliste',  cant:1,fin:new Date(2026,6,15)},
  {obra:'CACHAPOAL',          nombre:'Jose Carrizo',   cant:4,fin:new Date(2026,6,15)},
  {obra:'JULIA BERSTEIN',     nombre:'Vittorio Acosta',cant:1,fin:new Date(2026,5,15)},
];

const EVAL_COLORS={MB:'#1B4F8A',B:'#3A7D58',R:'#CE4620',M:'#9E4E00'};
const EVAL_ORDER={M:0,R:1,B:2,MB:3};

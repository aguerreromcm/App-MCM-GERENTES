import axios from "axios"

export const API_CONFIG = {
    BASE_URL: "http://3.13.66.5:5000",
    // BASE_URL: "http://192.168.1.2:5000",

    // Endpoints de la API
    ENDPOINTS: {
        LOGIN: "/login",
        LOGOUT: "/logout",
        AGREGAR_PAGO_CLIENTE: "/AgregarPagoCliente",
        CATALOGO_TIPOS_PAGO: "/CatalogoTiposPago",
        RESUMEN_DIARIO: "/ResumenDiario",
        RESUMEN_COBRANZA: "/ResumenCobranza",
        DETALLE_SEMANAL_EJECUTIVO: "/CobranzaSemanaActual",
        RUTA_COBRANZA_EJECUTIVO: "/RutaCobranzaEjecutivo",
        CONSULTA_CREDITO: "/ConsultaClientesGerente"
    },

    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        UNPROCESSABLE_ENTITY: 422,
        INTERNAL_SERVER_ERROR: 500
    }
}

// Crear instancia de axios con configuración base
export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 300000, // 5 minutos
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
    decompress: false
})

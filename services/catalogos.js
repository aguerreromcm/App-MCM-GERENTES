import { apiClient, API_CONFIG } from "./api"
import storage from "../utils/storage"

const TIPOS_PAGO_KEY = "tipos_pago_catalogo"

// Tipos de pago por defecto (hardcoded)
const TIPOS_PAGO_DEFAULT = [
    { codigo: "P", descripcion: "PAGO" },
    { codigo: "M", descripcion: "MULTA" }
]

/**
 * Estructura esperada del endpoint /ConsultaClientesEjecutivo:
 * {
 *   clientes: [
 *     {
 *       cdgns: "123456",           // Número de crédito
 *       nombre: "Juan Pérez",      // Nombre del cliente
 *       ciclo: 1,                  // Ciclo actual
 *       pago_semanal: 150.00,      // NUEVO CAMPO: Pago semanal del cliente
 *       // ... otros campos existentes
 *     }
 *   ]
 * }
 */

export default {
    // Obtener tipos de pago desde la API
    getTiposPago: async function () {
        const token = await storage.getToken()

        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.CATALOGO_TIPOS_PAGO, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data && response.data.tipos_pago) {
                // Guardar en storage local
                await storage.setItem(TIPOS_PAGO_KEY, JSON.stringify(response.data.tipos_pago))

                return {
                    success: true,
                    data: response.data.tipos_pago,
                    status: response.status
                }
            } else {
                throw new Error("Formato de respuesta inválido")
            }
        } catch (error) {
            console.error("Error al obtener tipos de pago:", error)

            // En caso de error, usar tipos de pago desde storage local o por defecto
            const tiposLocal = await this.getTiposPagoLocal()

            return {
                success: false,
                data: tiposLocal,
                error: error.response?.data?.message || error.message || "Error de conexión",
                status: error.response?.status || null
            }
        }
    },

    // Obtener tipos de pago desde storage local
    getTiposPagoLocal: async () => {
        try {
            const tiposString = await storage.getItem(TIPOS_PAGO_KEY)
            if (tiposString) {
                return JSON.parse(tiposString)
            }
        } catch (error) {
            console.error("Error al obtener tipos de pago locales:", error)
        }

        return TIPOS_PAGO_DEFAULT
    },

    inicializarCatalogos: async function () {
        try {
            const resultadoTipos = await this.getTiposPago()

            return {
                success: true,
                tiposPago: resultadoTipos.data,
                actualizadoDesdeAPI: resultadoTipos.success
            }
        } catch (error) {
            console.error("Error al inicializar catálogos:", error)
            const tiposLocal = await this.getTiposPagoLocal()

            return {
                success: false,
                tiposPago: tiposLocal,
                actualizadoDesdeAPI: false,
                error: error.message
            }
        }
    }
}

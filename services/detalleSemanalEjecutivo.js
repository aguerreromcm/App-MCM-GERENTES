import { apiClient, API_CONFIG } from "./api"
import storage from "../utils/storage"

export const detalleSemanalEjecutivo = {
    /**
     * Obtiene el detalle semanal de cobranza de un ejecutivo
     * @param {string} ejecutivo - Código del ejecutivo
     * @returns {Promise<{success: boolean, data: any, error?: string}>}
     */
    obtener: async (ejecutivo) => {
        try {
            const token = await storage.getToken()
            const response = await apiClient.post(
                API_CONFIG.ENDPOINTS.DETALLE_SEMANAL_EJECUTIVO,
                {
                    ejecutivo
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data) {
                return {
                    success: true,
                    data: response.data
                }
            } else {
                return {
                    success: false,
                    error: "No se recibió respuesta del servidor"
                }
            }
        } catch (error) {
            console.error("Error al obtener detalle semanal del ejecutivo:", error)
            return {
                success: false,
                error: error.response?.data?.message || "Error de conexión al servidor"
            }
        }
    }
}

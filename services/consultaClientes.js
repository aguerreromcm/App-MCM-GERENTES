import { apiClient, API_CONFIG } from "./api"
import storage from "../utils/storage"

export const consultaClientes = {
    /**
     * Consulta los datos de un cliente por su número de crédito
     * @param {string} numeroCredito - Número de crédito del cliente (6 dígitos)
     * @returns {Promise<{success: boolean, data?: any, error?: string, mensaje?: string}>}
     */
    consultarPorCredito: async (numeroCredito) => {
        try {
            // Validar que el número de crédito tenga el formato correcto
            if (!numeroCredito || numeroCredito.length !== 6) {
                return {
                    success: false,
                    error: "El número de crédito debe tener 6 dígitos"
                }
            }

            const token = await storage.getToken()

            const response = await apiClient.post(
                API_CONFIG.ENDPOINTS.CONSULTA_CREDITO,
                { cdgns: numeroCredito },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data && response.data.clientes && response.data.clientes.length > 0) {
                const cliente = response.data.clientes[0]
                return {
                    success: true,
                    valido: true,
                    data: {
                        ...cliente,
                        gerente: response.data.gerente
                    },
                    cliente: {
                        nombre: cliente.nombre,
                        ciclo: cliente.ciclo,
                        pago_semanal: cliente.pago_semanal,
                        saldo_total: cliente.saldo_total,
                        mora_total: cliente.mora_total,
                        dias_mora: cliente.dias_mora,
                        tipo_cartera: cliente.tipo_cartera,
                        dia_pago: cliente.dia_pago
                    }
                }
            } else {
                return {
                    success: false,
                    valido: false,
                    error: "Cliente no encontrado",
                    mensaje: "El número de crédito no existe o no está asignado a su cartera"
                }
            }
        } catch (error) {
            console.error("Error en consultaClientes.consultarPorCredito:", error)

            // Manejar errores específicos de la API
            if (error.response) {
                if (error.response.status === API_CONFIG.HTTP_STATUS.NOT_FOUND) {
                    return {
                        success: false,
                        valido: false,
                        error: "Cliente no encontrado",
                        mensaje: "El número de crédito no existe en el sistema"
                    }
                } else if (error.response.status === API_CONFIG.HTTP_STATUS.UNAUTHORIZED) {
                    return {
                        success: false,
                        error: "Sesión expirada",
                        mensaje: "Por favor, inicie sesión nuevamente"
                    }
                }
            }

            return {
                success: false,
                error: "Error de conexión",
                mensaje: error.message || "No se pudo conectar con el servidor"
            }
        }
    }
}

export default consultaClientes

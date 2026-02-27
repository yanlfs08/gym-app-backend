// src/utils/geo.ts

// 1. Busca coordenadas de um endereço usando a API gratuita do OpenStreetMap
export async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // O Nominatim exige um User-Agent válido
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'GymApp SaaS / 1.0',
      },
    })
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error)
    return null
  }
}

// 2. Fórmula de Haversine: Calcula a distância em METROS entre duas coordenadas geográficas
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Raio da Terra em metros
  
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  tipo: 'CLIENTE' | 'ADMIN'
  children: ReactNode
}

// Quem não está logado (ou tem o perfil errado) é enviado para o login correspondente
export default function RotaProtegida({ tipo, children }: Props) {
  const { usuario } = useAuth()
  const local = useLocation()

  if (!usuario || usuario.tipo !== tipo) {
    const destino = tipo === 'ADMIN' ? '/admin/login' : '/login'
    return <Navigate to={destino} state={{ de: local.pathname }} replace />
  }
  return <>{children}</>
}

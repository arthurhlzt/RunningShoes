import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import Layout from './components/Layout'
import RotaProtegida from './components/RotaProtegida'
import Cadastro from './pages/Cadastro'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import Login from './pages/Login'
import MeusPedidos from './pages/MeusPedidos'
import TenisDetalhe from './pages/TenisDetalhe'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEstoque from './pages/admin/AdminEstoque'
import AdminLogin from './pages/admin/AdminLogin'
import AdminMarcas from './pages/admin/AdminMarcas'
import AdminPedidos from './pages/admin/AdminPedidos'
import AdminTenis from './pages/admin/AdminTenis'

export default function App() {
  return (
    <Routes>
      {/* Loja */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tenis/:id" element={<TenisDetalhe />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/checkout"
          element={
            <RotaProtegida tipo="CLIENTE">
              <Checkout />
            </RotaProtegida>
          }
        />
        <Route
          path="/pedidos"
          element={
            <RotaProtegida tipo="CLIENTE">
              <MeusPedidos />
            </RotaProtegida>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Route>

      {/* Painel do administrador */}
      <Route
        path="/admin"
        element={
          <RotaProtegida tipo="ADMIN">
            <AdminLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="tenis" element={<AdminTenis />} />
        <Route path="tenis/:id/estoque" element={<AdminEstoque />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="marcas" element={<AdminMarcas />} />
      </Route>
    </Routes>
  )
}

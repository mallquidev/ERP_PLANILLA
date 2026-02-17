import React, { useState } from 'react'
import TableGlobal from '../ui/table/TableGlobal'

function TrabajadorPage() {

  const [trabajadores, setTrabajadores] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      dni: '12345678',
      cargo: 'Desarrollador',
      salario: 3500,
      estado: 'ACTIVO'
    },
    {
      id: 2,
      nombre: 'María López',
      dni: '87654321',
      cargo: 'Contadora',
      salario: 4200,
      estado: 'INACTIVO'
    }
  ])

  const columns = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'dni', label: 'DNI', type: 'text' },
    { key: 'cargo', label: 'Cargo', type: 'text' },
    { key: 'salario', label: 'Salario', type: 'number' },
    { key: 'estado', label: 'Estado', type: 'text' }
  ]

  return (
    <TableGlobal
      data={trabajadores}
      setData={setTrabajadores}
      columns={columns}
      title="Trabajadores"
    />
  )
}

export default TrabajadorPage

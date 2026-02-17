import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

function ModalGlobal({
  modalType,
  formData,
  setFormData,
  onClose,
  onSave,
  columns = []
}) {

  if (modalType !== 'add' && modalType !== 'edit') return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const renderField = (col) => {

    // Select dinamico
    if (col.type === "select") {
      return (
        <select
          name={col.key}
          value={formData[col.key] ?? ''}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
        >
          <option value="">-- Seleccionar --</option>
          {col.options?.map((opt) => (
            <option key={opt.PKID ?? opt.value} value={opt.PKID ?? opt.value}>
              {opt.label ?? opt.nombre ?? opt.RazonSocial ?? opt.RegimenTributario ?? opt.SectorEconomico ?? opt.SituacionRegistro}
            </option>
          ))}
        </select>
      )
    }

    // Inputs normales
    return (
      <input
        type={col.type || 'text'}
        name={col.key}
        value={formData[col.key] ?? ''}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-lg"
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">

        {/* header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {modalType === 'add' ? 'Add Record' : 'Edit Record'}
          </h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* body */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {columns.map(col => (
            <div key={col.key}>
              <label className="block text-sm font-semibold mb-1">
                {col.label}
              </label>
              {renderField(col)}
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}

export default ModalGlobal

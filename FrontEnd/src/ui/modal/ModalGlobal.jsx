import React, { useEffect } from 'react'
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

  
  useEffect(() => {
    if (modalType === 'add') {
      columns.forEach(col => {
        if (col.defaultValue !== undefined && !formData[col.key]) {
          setFormData(prev => ({
            ...prev,
            [col.key]: col.defaultValue
          }))
        }
      })
    }
  }, [modalType, columns])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const renderField = (col) => {

    if (col.type === "select") {
      return (
        <select
          name={col.key}
          value={formData[col.key] ?? ''}
          onChange={handleChange}
          disabled={col.disabled} //permite bloquear select
          className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">-- Seleccionar --</option>
          {col.options?.map((opt) => (
            <option
              key={opt[col.optionValue || "PKID"]}
              value={opt[col.optionValue || "PKID"]}
            >
              {opt[col.displayKey] ?? ""}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        type={col.type || 'text'}
        name={col.key}
        value={formData[col.key] ?? ''}
        onChange={handleChange}
        disabled={col.disabled} // permitir bloquear
        className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
      
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl flex flex-col">

        {/* header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg sm:text-xl font-bold">
            {modalType === 'add' ? 'Agregar' : 'Editar'}
          </h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6 text-red-700" />
          </button>
        </div>

        {/* body con scroll */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map(col => (
              <div key={col.key}>
                <label className="block text-sm font-semibold mb-1">
                  {col.label}
                </label>
                {renderField(col)}
              </div>
            ))}
          </div>
        </div>

        {/* footer fijo abajo */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white">
          <button
            onClick={onSave}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )
}

export default ModalGlobal
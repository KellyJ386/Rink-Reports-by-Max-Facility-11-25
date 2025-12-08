'use client'

import { useState, useMemo } from 'react'
import type { EmployeeBasicInfo, EmployeeScheduleSummary } from '@/types/schedule'

interface EmployeeListProps {
  employees: (EmployeeBasicInfo & {
    totalHours?: number
    scheduledShifts?: number
    pendingTimeOff?: number
  })[]
  onEmployeeClick?: (employeeId: string) => void
  selectedEmployeeId?: string
  showStats?: boolean
}

export function EmployeeList({
  employees,
  onEmployeeClick,
  selectedEmployeeId,
  showStats = true,
}: EmployeeListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('')

  // Get unique roles
  const roles = useMemo(() => {
    const roleSet = new Set<string>()
    for (const emp of employees) {
      if (emp.role?.name) roleSet.add(emp.role.name)
    }
    return Array.from(roleSet).sort()
  }, [employees])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = !filterRole || emp.role?.name === filterRole

      return matchesSearch && matchesRole
    })
  }, [employees, searchQuery, filterRole])

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Employees ({employees.length})</h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input w-full text-sm mb-2"
        />

        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input w-full text-sm"
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Employee List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No employees found
          </div>
        ) : (
          <ul className="divide-y">
            {filteredEmployees.map((emp) => (
              <li
                key={emp.id}
                onClick={() => onEmployeeClick?.(emp.id)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedEmployeeId === emp.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{emp.role?.name}</div>
                  </div>

                  {!emp.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                {showStats && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {emp.scheduledShifts !== undefined && (
                      <span>{emp.scheduledShifts} shifts</span>
                    )}
                    {emp.totalHours !== undefined && (
                      <span>{emp.totalHours}h</span>
                    )}
                    {emp.pendingTimeOff !== undefined && emp.pendingTimeOff > 0 && (
                      <span className="text-orange-600">
                        {emp.pendingTimeOff} time-off
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

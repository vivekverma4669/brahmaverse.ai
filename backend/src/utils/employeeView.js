export function employeeView(employee) {
  return {
    _id: employee._id,
    name: employee.name,
    email: employee.email,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

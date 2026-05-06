export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source])

    if (!parsed.success) {
      return next(new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid request'))
    }

    req[source] = parsed.data
    return next()
  }
}

export function pickUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    school: user.school,
  }
}

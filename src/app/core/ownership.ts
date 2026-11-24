// The API gives an ADMIN the records of every user (to manage them).
// Screens about "my finances" (dashboard, budgets) must only use the records of the logged-in user.
export function onlyOwn<T extends { idUsuario: number }>(items: T[], idUsuario: number | undefined): T[] {
  if (idUsuario === undefined) return []; // the user is still loading: show nothing instead of other people's data
  return items.filter((item) => item.idUsuario === idUsuario);
}

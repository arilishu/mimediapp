export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  if (years === 0) {
    if (months === 0) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} dias`;
    }
    return months === 1 ? "1 mes" : `${months} meses`;
  }
  
  if (months === 0) {
    return years === 1 ? "1 año" : `${years} años`;
  }
  
  const yearStr = years === 1 ? "1 año" : `${years} años`;
  const monthStr = months === 1 ? "1 mes" : `${months} meses`;
  
  return `${yearStr}, ${monthStr}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(dateString: string, time?: string): string {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  
  if (time) {
    return `${dateStr} - ${time}`;
  }
  
  return dateStr;
}

export function getChildTintColor(index: number, colors: any): string {
  const tints = [
    colors.childTint1,
    colors.childTint2,
    colors.childTint3,
    colors.childTint4,
  ];
  return tints[index % tints.length];
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isFuture(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export function isPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function toIsoDate(date?: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

export function formatDateTime(date?: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';

    // Lấy ngày, tháng, năm
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = d.getFullYear();

    // Lấy giờ, phút, giây
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    // Nối lại theo định dạng DD-MM-YYYY HH:mm:ss
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
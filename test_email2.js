const newUsername = "Nguyễn Văn A!@#";
const email = `${newUsername.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '')}@toanhoc.pro`;
console.log(email);

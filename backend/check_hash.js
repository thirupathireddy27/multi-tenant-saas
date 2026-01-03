const bcrypt = require('bcryptjs');

const hash = '$2b$10$qUR.cCDxGDV6eIg66zZSK.Tsxdrzumr16oqJBZivk6Cx45R8HK/DK';
const password = 'password123';

bcrypt.compare(password, hash).then(res => {
    console.log('Match:', res);
});

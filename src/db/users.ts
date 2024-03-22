export interface User {
    username: string;
    company: string;
    companyLogo: string
    isRetailer: boolean;
    role: string;
    license: 'Basic' | 'Premium';
  }

  export const users: User[] = [
    {
        username: 'Mario', 
        company: 'E-Bikes LLC', 
        companyLogo: 'ebikes-logo.png', 
        isRetailer: false, 
        role: 'Partner Manager', 
        license: 'Premium',
    },
    {
        username: 'McKenzie', 
        company: 'Wheelworks', 
        companyLogo: 'Wheelworks-logo.png', 
        isRetailer: true, 
        role: 'Retail Shop Owner', 
        license: 'Basic',
    },
  ]
  
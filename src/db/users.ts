export type LicenseType = 'Basic' | 'Premium';

/** Persona allowed to use the Analyze experience (nav + `/…/analyze` route). */
export function isMcKenziePersona(user: User | undefined): boolean {
  return user?.username === 'McKenzie';
}

export interface User {
    username: string;
    company: string;
    companyLogo: string
    isRetailer: boolean;
    role: string;
    license: LicenseType;
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
  
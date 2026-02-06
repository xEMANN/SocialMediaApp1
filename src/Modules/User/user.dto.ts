export interface LogoutDTO {
  flag: string; 
}

export interface ISignUpDTO {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender?: string; 
}
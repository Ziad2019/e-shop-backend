export interface JwtPayload {
  sub:   string;
  id:    string;
  email: string;
  role:  string;
  iat?:  number;
  exp?:  number;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string; 
}

export interface GoogleProfile {
  googleId:    string;
  email:       string;
  name:        string;
  avatar?:     string;
  accessToken: string;
}

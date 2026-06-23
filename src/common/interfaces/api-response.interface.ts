export interface ApiResponse<T> {
  status:   number;
  message:  string;
  length?:  number;

  // Pagination meta (list responses only)
  total?:   number;
  page?:    number;
  pages?:   number;

  data: T;
}
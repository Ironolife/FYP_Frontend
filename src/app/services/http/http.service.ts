import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const SERVER_BASE_URL = "http://127.0.0.1:5000/api/";

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  summarize(article: string, summary: string) {

    const body = {
      'article': [article? article: ''],
      'summary': [summary? summary: '']
    }

    return this.http.post(SERVER_BASE_URL + 'summary', body).toPromise();

  }

  summarize_multiple(article: string[], summary: string[]) {

    const body = {
      'article': article,
      'summary': summary
    }

    return this.http.post(SERVER_BASE_URL + 'summary', body).toPromise();

  }

}

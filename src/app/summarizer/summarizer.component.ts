import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpService } from '../services/http/http.service';
import { MatDialog } from '@angular/material/dialog';
import { OutputInfoComponent } from './output-info/output-info.component';
import { ScoresInfoComponent } from './scores-info/scores-info.component';
import { SAMPLE_ARTICLE } from './samples';

@Component({
  selector: 'app-summarizer',
  templateUrl: './summarizer.component.html',
  styleUrls: ['./summarizer.component.scss']
})
export class SummarizerComponent implements OnInit {

  article = new FormControl('');
  summary = new FormControl('');
  batch_size = new FormControl(10);

  placeholders: {article: string, summary: string, summary_temp?: string};

  output = '';
  loading_output = false;

  dummy = document.createElement('span');

  statistics = null;

  batch_testing: {
    article: string,
    summary: string,
    output?: {
      word: string,
      type: string
    }[],
    scores?: {
      rouge1: string
      rouge2: string
      rougel: string
      rouge1_raw: number
      rouge2_raw: number
      rougel_raw: number
    }
  }[];

  batch_avg?: {
    rouge1: string
    rouge2: string
    rougel: string
    rouge1_raw: number
    rouge2_raw: number
    rougel_raw: number
  };

  loading_batch = false;

  constructor(private http: HttpService, private dialog: MatDialog) { }

  ngOnInit(): void {

    this.random_input_placeholder();

    this.random_batch_testing();

    this.dummy.innerHTML = "Hi!";

  }

  async summarize() {

    this.loading_output = true;

    const article = this.article.value? this.article.value: this.placeholders.article;
    const summary = this.article.value? this.summary.value: this.placeholders.summary;

    const res = await this.http.summarize(article, summary);

    this.loading_output = false;

    this.output = (res as any).summary[0];

    this.create_output_element();

    this.create_statistics(article, this.output, (res as any).scores[0]);

  }

  random_input_placeholder() {

    this.placeholders = SAMPLE_ARTICLE[Math.floor(Math.random() * SAMPLE_ARTICLE.length)];
    this.placeholders.summary_temp = this.placeholders.summary;

    this.article.reset();
    this.summary.reset();

  }

  async random_batch_testing() {

    this.loading_batch = true;
    this.batch_size.disable();

    const shuffled_samples = SAMPLE_ARTICLE.sort(() => 0.5 - Math.random()).slice(0, this.batch_size.value);

    this.batch_avg = null;

    this.batch_testing = shuffled_samples.map(s => {
      return {
        article: s.article,
        summary: s.summary,
      };
    });

    const result = await this.http.summarize_multiple(shuffled_samples.map(s => s.article), shuffled_samples.map(s => s.summary));

    for(let i = 0; i < this.batch_size.value; i++) {
      this.batch_testing[i].output = this.create_batch_output(this.batch_testing[i].article, (result as any).summary[i], this.batch_testing[i].summary);
      this.batch_testing[i].scores = {
        rouge1_raw: (result as any).scores[i]['rouge-1'].f,
        rouge2_raw: (result as any).scores[i]['rouge-2'].f,
        rougel_raw: (result as any).scores[i]['rouge-l'].f,
        rouge1: (result as any).scores[i]['rouge-1'].f.toFixed(3),
        rouge2: (result as any).scores[i]['rouge-2'].f.toFixed(3),
        rougel: (result as any).scores[i]['rouge-l'].f.toFixed(3),
      }

    };

    this.batch_avg = {
      rouge1_raw: (result as any).scores.reduce((a, b) => a + b['rouge-1'].f, 0) / this.batch_size.value,
      rouge2_raw: (result as any).scores.reduce((a, b) => a + b['rouge-2'].f, 0) / this.batch_size.value,
      rougel_raw: (result as any).scores.reduce((a, b) => a + b['rouge-l'].f, 0) / this.batch_size.value,
      rouge1: ((result as any).scores.reduce((a, b) => a + b['rouge-1'].f, 0) / this.batch_size.value).toFixed(3),
      rouge2: ((result as any).scores.reduce((a, b) => a + b['rouge-2'].f, 0) / this.batch_size.value).toFixed(3),
      rougel: ((result as any).scores.reduce((a, b) => a + b['rouge-l'].f, 0) / this.batch_size.value).toFixed(3),
    }

    this.loading_batch = false;
    this.batch_size.enable();

  }

  create_output_element() {

    const summary_element = document.getElementById('summary') as HTMLDivElement;
    summary_element.innerHTML = "";

    const article_words: string[] = (this.article.value? this.article.value: this.placeholders.article).trim().split(' ');

    const generated_summary_words = this.output.trim().split(' ');
    
    const reference: string = this.summary.value? this.summary.value: this.placeholders.summary;
    const reference_summary_words = reference.trim().split(' ');

    if(reference_summary_words.length > 0) {

      for(let word of generated_summary_words) {

        const span = document.createElement('span');
        span.innerHTML = word;
  
        if(reference_summary_words.includes(word)) {

          span.style.color = "limegreen";
          span.style.fontWeight = "500";

          if(!article_words.includes(word)) {
            span.style.textDecoration = "underline";
          }

  
        } else {

          if(!article_words.includes(word)) {
            span.style.color = "darkorange";
            span.style.fontWeight = "500";
          }

        }
          
        summary_element.append(span);

        const space = document.createElement('span');
        space.innerHTML = "&nbsp;";
        summary_element.append(space);
  
      }

    }

  }

  create_batch_output(article, summary, reference) {

    const article_words = article.trim().split(' ');
    const generated_summary_words = summary.trim().split(' ');
    const reference_summary_words = reference.trim().split(' ');

    const outputs = [];

    if(reference_summary_words.length > 0) {

      for(let word of generated_summary_words) {

        const output = {
          word: word,
          type: 't2'
        };
  
        if(reference_summary_words.includes(word)) {

          output.type = 't0';

          if(!article_words.includes(word)) {
            output.type = 't1';
          }

  
        } else {

          if(!article_words.includes(word)) {
            output.type = 't3';
          }

        }

        outputs.push(output);
  
      }

    }

    return outputs;

  }

  create_statistics(article: string, summary: string, scores: any) {

    const article_length = article.split(' ').length;
    const summary_length = summary.split(' ').length;
    const reduction = Math.abs((summary_length - article_length) / article_length * 100).toFixed(2);

    if(scores) {

      this.statistics = {
        article_length: article_length,
        summary_length: summary_length,
        reduction: reduction,
        rouge1: scores['rouge-1'].f.toFixed(3),
        rouge2: scores['rouge-2'].f.toFixed(3),
        rougel: scores['rouge-l'].f.toFixed(3)
      };

    } else {

      this.statistics = {
        article_length: article_length,
        summary_length: summary_length,
        reduction: reduction
      };

    }

  }

  onArticleChange() {

    if(this.article.value) {

      this.placeholders.summary = '';

    } else {

      this.placeholders.summary = this.placeholders.summary_temp;
      this.summary.reset();

    }

  }

  onFileUpload(changeEvent, target: FormControl) {

    const file = changeEvent.target.files[0];

    const file_reader = new FileReader();

    file_reader.onload = (loadEvent) => {
      const text = loadEvent.target.result;
      target.setValue(text);
      if(target == this.article) {
        this.onArticleChange();
      }
      (changeEvent.srcElement as HTMLInputElement).value = null;
    };

    file_reader.readAsText(file);

  }

  output_info() {

    this.dialog.open(OutputInfoComponent, {
      width: "450px"
    });

  }

  scores_info() {

    this.dialog.open(ScoresInfoComponent, {
      width: "450px"
    });

  }

}
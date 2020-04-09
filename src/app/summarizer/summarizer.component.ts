import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpService } from '../services/http/http.service';
import { MatDialog } from '@angular/material/dialog';
import { OutputInfoComponent } from './output-info/output-info.component';
import { ScoresInfoComponent } from './scores-info/scores-info.component';

@Component({
  selector: 'app-summarizer',
  templateUrl: './summarizer.component.html',
  styleUrls: ['./summarizer.component.scss']
})
export class SummarizerComponent implements OnInit {

  article = new FormControl('');
  summary = new FormControl('');

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

    const size = 10;

    const shuffled_samples = SAMPLE_ARTICLE.sort(() => 0.5 - Math.random()).slice(0, size);

    this.batch_avg = null;

    this.batch_testing = shuffled_samples.map(s => {
      return {
        article: s.article,
        summary: s.summary,
      };
    });

    const result = await this.http.summarize_multiple(shuffled_samples.map(s => s.article), shuffled_samples.map(s => s.summary));

    for(let i = 0; i < 10; i++) {
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
      rouge1_raw: (result as any).scores.reduce((a, b) => a + b['rouge-1'].f, 0) / size,
      rouge2_raw: (result as any).scores.reduce((a, b) => a + b['rouge-2'].f, 0) / size,
      rougel_raw: (result as any).scores.reduce((a, b) => a + b['rouge-l'].f, 0) / size,
      rouge1: ((result as any).scores.reduce((a, b) => a + b['rouge-1'].f, 0) / size).toFixed(3),
      rouge2: ((result as any).scores.reduce((a, b) => a + b['rouge-2'].f, 0) / size).toFixed(3),
      rougel: ((result as any).scores.reduce((a, b) => a + b['rouge-l'].f, 0) / size).toFixed(3),
    }

    this.loading_batch = false;

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

const SAMPLE_ARTICLE = [
  {
    "article": "romanian president traian basescu proposed on tuesday developing new pipelines to transport oil from the caspian basin to the european union lrb eu rrb states so as to reduce dependence on russia s energy supplies\n",
    "summary": "romania proposes alternative routes for caspian basin oil to eu\n"
  },
  {
    "article": "brazil s air traffic crisis was aggravated on tuesday when at least flights were delayed in sao paulo s airport\n",
    "summary": "brazil s air traffic crisis aggravated\n"
  },
  {
    "article": "hong kong stocks rose points or percent to open at on wednesday\n",
    "summary": "hong kong stocks open higher nov\n"
  },
  {
    "article": "the changqing subsidiary of petrochina the largest oil producer in china has been forced to sacrifice one billion yuan lrb million u s dollars rrb in profits to protect drinking water supplies in northwest china s shaanxi province\n",
    "summary": "petrochina incurs one billion yuan loss through closure of oil wells\n"
  },
  {
    "article": "a team of experts are due to arrive in sunsari district on wednesday to tame a wild elephant which has killed eight persons in sunsari and morang districts in eastern nepal so far the himalayan times reported on wednesday\n",
    "summary": "experts to tame killer elephant in eastern nepal\n"
  },
  {
    "article": "an australian koala has given birth to rare twin cubs in a safari park in south china s guangdong province\n",
    "summary": "australian koala gives birth to rare twin cubs in south china\n"
  },
  {
    "article": "brazilian president luiz inacio lula da silva on tuesday outlined boosting economic development improving education and reducing poverty as his priorities in his second term\n",
    "summary": "brazilian president outlines priorities for second term\n"
  },
  {
    "article": "indonesian police have arrested suspects of terrorist acts in central sulawesi province said a police spokesman here wednesday\n",
    "summary": "indonesian police arrest terrorist suspects in central sulawesi\n"
  },
  {
    "article": "the colombian government soldiers on tuesday destroyed seven cocaine laboratories of the largest guerrilla group in the eastern part of the nation army officials said on tuesday\n",
    "summary": "seven cocaine labs destroyed in colombia\n"
  },
  {
    "article": "the united states will launch strategic dialogue with afghanistan in january u s undersecretary of state nicholas burns said on tuesday\n",
    "summary": "u s afghanistan to launch strategic dialogue in january\n"
  },
  {
    "article": "laotian prime minister bouasone bouphavanh left here on wednesday after attending a commemorative summit marking the th anniversary of the dialogue partnership between china and the association of southeast asian nations lrb asean rrb\n",
    "summary": "laotian pm leaves nanning after attending china asean summit\n"
  },
  {
    "article": "more than people lost their lives annually in recent years in myanmar due to car accidents a local news journal reported wednesday\n",
    "summary": "over die of car accident annually in myanmar\n"
  },
  {
    "article": "vietnam which attracted nearly billion u s dollars worth of foreign direct investment in the first months of will entice the total investment of at least billion dollars in the year the local newspaper labor reported wednesday\n",
    "summary": "vietnam s foreign investment expected to reach bln usd this year\n"
  },
  {
    "article": "african union lrb au rrb commission chairman alpha oumar konare arrived here wednesday morning to attend the beijing summit of the forum on the china africa cooperation lrb focac rrb scheduled for nov\n",
    "summary": "au chief arrives in beijng for china africa summit\n"
  },
  {
    "article": "two more patients who had been diagnosed with having dengue unk fever lrb dhf rrb died at a hospital in karachi capital of pakistan s sindh province rising the death toll to in the province local newspaper the nation reported on wednesday\n",
    "summary": "dengue claims more lives in pakistan\n"
  },
  {
    "article": "the democratic people s republic of korea lrb dprk rrb said on wednesday that it has decided to return to the six party talks the official korean central news agency lrb kcna rrb reported\n",
    "summary": "st unk says it will return to six party talks\n"
  },
  {
    "article": "yemeni air forces shelled on thursday the strongholds of the shiite rebels in saada province northern yemen while the land troops confronted with the insurgents in different areas of the province pan arab al jazeera tv reported\n",
    "summary": "yemeni air unk shell rebels hideouts\n"
  },
  {
    "article": "turkish foreign minister said economic sanctions against iran will not produce any results and that turkey does not want its region to face a new armed clash regardless of the source of the tension the semi official anatolia news agency reported late wednesday\n",
    "summary": "turkey against economic sanctions against iran says fm\n"
  },
  {
    "article": "turkish prime minister recep tayyip erdogan said wednesday the turkish government will take care of azerbaijan s interests in talks with armenia to normalize relations the semi official anatolia news agency reported\n",
    "summary": "turkey says to consider azerbaijan s interests in talks with armenia\n"
  },
  {
    "article": "the international monetary fund lrb imf rrb said thursday the outlook for the middle east has improved with the global economy stabilizing and oil prices rebounding\n",
    "summary": "imf expects strengthening growth prospects in middle east\n"
  },
  {
    "article": "an israeli diplomat has been accused of spying in russia and forced to leave moscow an israeli newspaper reported on thursday\n",
    "summary": "israeli diplomat accused of spying in russia sent back home\n"
  },
  {
    "article": "tunisia s central bank said on thursday that it kept its main interest rate steady at percent thanks to a slowing inflation rate\n",
    "summary": "tunisia keeps main interest rate unchanged\n"
  },
  {
    "article": "after argentine diplomat s attempt to smuggle antiques from iran was foiled iran s foreign ministry spokesman hassan qashqavi said thursday that diplomats should fully observe and respect the regulations of the countries the official irna news agency reported\n",
    "summary": "iran says diplomats should respect regulations of countries after argentine diplomat s smuggle case\n"
  },
  {
    "article": "about jobless workers and college students rallied thursday in istanbul in protest of the annual meeting of the international monetary fund lrb imf rrb\n",
    "summary": "protests sparked in istanbul ahead of imf annual meeting\n"
  },
  {
    "article": "the united states embassy in khartoum thursday denied the u s government has imposed a travel ban on sudanese political officials as stated earlier by press reports\n",
    "summary": "u s embassy in khartoum denies travel ban on sudanese officials\n"
  },
  {
    "article": "the tel aviv stock exchange lrb tase rrb general share index closed at points on thursday up points from wednesday s finish\n",
    "summary": "tel aviv stock exchange index closes higher\n"
  },
  {
    "article": "israeli government decided to choose a hard line against a united nations investigation report on israel s military operation in the hamas ruled gaza strip last winter with its prime minister expressing harsh words on the report thursday\n",
    "summary": "israel chooses hard line against un gaza report\n"
  },
  {
    "article": "syrian president bashar al assad sent on thursday a message to indonesian leader over the victims of the spate of earthquakes that jolted the indonesian island of sumatra the official syrian arab news agency reported\n",
    "summary": "syria president offers condolence to indonesia over earthquake victims in sumatra\n"
  },
  {
    "article": "turkish prime minister recep tayyip erdogan thursday said he considered the protest against international monetary fund lrb imf rrb managing director dominique strauss kahn as an attack turkish anatolia news agency reported\n",
    "summary": "turkish pm considers protest against imf chief as attack\n"
  },
  {
    "article": "another quake measuring magnitude on thursday jolted west sumatra the same place hit by a magnitude quake on wednesday\n",
    "summary": "deaths feared in fresh strong quake in indonesia s west sumatra\n"
  },
  {
    "article": "the myanmar authorities have seized more unk stimulant tablets in the border town of tachilek shan unk of the country according to the central committee for drug abuse control thursday\n",
    "summary": "myanmar seizes more stimulants in eastern border town\n"
  },
  {
    "article": "indonesia s health ministry crisis center head rustam unk said here on friday that the death toll could reach thousands as many victims were still trapped in the second day under the rubble of the buildings collapsed by the magnitude earthquake in west sumatra province\n",
    "summary": "indonesia s quake death toll feared to rise to thousands as un s estimation reaches\n"
  },
  {
    "article": "south korea saw a surge in foreign direct investment lrb fdi rrb into the nation in the third quarter on the back of the government s stimulus packages and favorable exchange rates a government report said thursday\n",
    "summary": "s korea sees sharp rise in foreign direct investment in q\n"
  },
  {
    "article": "the u s dollar traded at the upper yen level thursday morning in tokyo\n",
    "summary": "dollar at upper yen in tokyo\n"
  },
  {
    "article": "indian stocks opened higher thursday with the key sensex index up by points\n",
    "summary": "indian stocks open higher\n"
  },
  {
    "article": "at least bodies have been pulled from the rubble so far in west sumatra province s capital city of padang with the death toll is feared to exceed after a magnitude quake hit off sumatra island on wednesday evening the jakarta globe reported here on thursday\n",
    "summary": "over bodies pulled from rubble in padang death toll feared to exceed\n"
  },
  {
    "article": "vietnam reduced retail price of a petroleum most commonly used by motorbike drivers in the country by vietnamese dong lrb u s cents rrb to vietnamese dong lrb u s cents rrb a liter on thursday vietnam news agency reported\n",
    "summary": "vietnam reduces retail price of petroleum products\n"
  },
  {
    "article": "the central bank of myanmar started on thursday to put a unk denomination of currency notes of unk into circulation while keeping all other existing currency notes and coins as legal tender\n",
    "summary": "myanmar puts new denomination of currency notes into circulation\n"
  },
  {
    "article": "a month old boy became australia s fourth fatality from the samoan tsunami foreign affairs officials confirmed on thursday\n",
    "summary": "fouth australian killed in samoan tsunami\n"
  },
  {
    "article": "afghan police at kabul international airport detained two nigerian nationals and one afghan citizen and foiled their attempt to traffick heroin outside the country local newspaper reported thursday\n",
    "summary": "afghan police foils drug smuggling\n"
  },
  {
    "article": "south korea said thursday the democratic people s republic of korea lrb dprk rrb s rejection of the so called grand bargain which seoul proposed to pyongyang as a measure to end the nuclear program was regrettable\n",
    "summary": "s korea shows regret on dprk s rejection of grand bargain\n"
  },
  {
    "article": "five people were killed and three others injured as a bus rammed into an auto rickshaw on a highway in bangladesh s eastern comilla district some km away from capital city of dhaka thursday morning local police said\n",
    "summary": "road accident kills injures in bangladesh\n"
  },
  {
    "article": "some leaders of overseas chinese in myanmar said on thursday that the th anniversary chinese national day parade was unprecedentedly grand which demonstrates the strength of the motherland and shows confidence in anticipation of the future\n",
    "summary": "overseas chinese in myanmar praise national day parade\n"
  },
  {
    "article": "tremors resulted from the strong earthquake that hit southern sumatra indonesia thursday were felt in several areas in peninsula malaysia\n",
    "summary": "quake tremors felt across malaysia\n"
  },
  {
    "article": "a filipino marine officer was killed and others wounded as they clashed with a group of militants on thursday in the southern philippine province of sulu days after two u s servicemen died in roadside bombing in the region\n",
    "summary": "marine officer dead injured in clashes in s philippines\n"
  },
  {
    "article": "the german troops of provincial reconstruction team lrb prt rrb in partnership with afghan security forces would speed up their operation against anti government militants in kunduz province of northern afghanistan the newly appointed commander of german prt said on thursday\n",
    "summary": "german unk afghan forces to speed up military operation in n afghanistan\n"
  },
  {
    "article": "indonesian transportation ministry urged airline operators not to increase airfare to padang of west sumatra province that was hit by magnitude earthquake the private radio station elshinta quoted an official as saying on thursday\n",
    "summary": "indonesian gov t urges airline operators not to raise airfare to quake hit padang\n"
  },
  {
    "article": "cambodian foreign minister hor namhong said on thursday that his country expressed the hope that the u s to shift cambodia s debt as development aid for the country\n",
    "summary": "cambodia hopes u s to shift s debt as development aid\n"
  },
  {
    "article": "typhoon ketsana which hit vietnamese central and highland provinces has left people dead missing and injured vietnam news agency reported thursday\n",
    "summary": "death toll from typhoon ketsana rises to in vietnam\n"
  },
  {
    "article": "the international monetary fund lrb imf rrb upgraded the economic growth estimation in and in several countries with the highest growth estimation set for china and five asean countries the detik com news portal reported here on thursday\n",
    "summary": "imf upgrades world s economy growth\n"
  },
  {
    "article": "as of thursday afternoon the death toll in the powerful earthquake that hit the west sumatra province wednesday has reached people an official at the indonesian social ministry said here on thursday\n",
    "summary": "death toll of padang earthquake reaches\n"
  },
  {
    "article": "cambodian foreign minister hor namhong said on thursday that his country will host the meeting of technical expertise cooperation between the lower mekong river and the u s mississippi river in the near future to tighten the cooperation of the sister rivers\n",
    "summary": "cambodia to host lower unk rivers meeting on technical cooperation\n"
  },
  {
    "article": "philippine monetary officials decided to keep key policy interest rates on expectations that inflation level will remain benign for the rest of the year the philippine central bank said on thursday\n",
    "summary": "philippine monetary board keeps policy rates steady\n"
  },
  {
    "article": "the international monetary fund revised up south korean economic growth for next year to percent after a contraction of percent this year citing brisk exports and improving domestic demand local media reported thursday\n",
    "summary": "imf revises growth outlook for s korea in\n"
  },
  {
    "article": "thailand s consumer price index lrb cpi rrb for september was down one percent year on year while it was percent higher than that of august the ministry of commerce reported thursday\n",
    "summary": "thailand s cpi for september drops pct year on year\n"
  },
  {
    "article": "hundreds of south koreans on thursday bid a tearful farewell to their relatives in the democratic people s republic of korea lrb dprk rrb as the six day reunions of families separated by the korean war wrapped up in mount kumgang resort\n",
    "summary": "s korean dprk separated families bid farewell as reunions end\n"
  },
  {
    "article": "philippine armed forces chief gen victor unk said on thursday last monday s attack against u s troops in sulu that left two american servicemen and a filipino soldier dead was an isolated case but all american soldiers in mindanao were told to be wary of their security\n",
    "summary": "philippine military chief says attack on gis an isolated case\n"
  },
  {
    "article": "the maritime search and rescue office in thailand s central beach resort town pattaya thursday has instructed local people and tourists to stop sea traveling\n",
    "summary": "thailand resort on alert for typhoon ketsana\n"
  },
  {
    "article": "the u s dollar traded around the yen line thursday in tokyo\n",
    "summary": "dollar around yen line in tokyo\n"
  },
  {
    "article": "foreign arrivals to vietnam went down percent year on year to million in the first nine months of this year said a report on the website of vietnamese general statistics office on thursday\n",
    "summary": "foreign arrivals to vietnam down in first nine months\n"
  },
  {
    "article": "the indonesian government has declared on thursday evacuation of victims a top priority of humanitarian efforts in padang and unk west sumatra following a magnitude earthquake that rattled the province on wednesday\n",
    "summary": "indonesian government prioritizes quake victims evacuation\n"
  },
  {
    "article": "the bangladeshi government has taken initiative to build shelters for old people in the country s all six divisions to ensure social security of the senior citizens local private news agency unb reported on thursday\n",
    "summary": "bangladesh to build old people shelters in all divisions\n"
  },
  {
    "article": "thailand s prime minister abhisit vejjajiva has reiterated thursday that a public referendum is needed during the country s charter amendment process\n",
    "summary": "thai pm reiterates public referendum needs during charter amendment process\n"
  },
  {
    "article": "two civilians were killed as a bomb ripped through a wedding party in paktika province east of afghanistan on thursday an official said\n",
    "summary": "explosion in wedding party kills afghans wounds in east afghanistan\n"
  },
  {
    "article": "philippine president arroyo has directed the heads of government agencies including government owned and controlled corporations lrb unk rrb and local government units lrb lgus rrb to deploy their workforce in relief and rehabilitation efforts in areas ravaged by typhoon ondoy lrb international code name ketsana rrb\n",
    "summary": "philippine president orders government participation in relief and rehabilitation\n"
  },
  {
    "article": "thailand s anti government group the the united front for democracy against dictatorship lrb udd rrb will host three anti government protests within october natthawut saikua udd core leader said thursday\n",
    "summary": "thai anti gov t group plans new rallies\n"
  },
  {
    "article": "the pakistani government issued a commemorative coin of rupees thursday to celebrate th anniversary of the founding of the people s republic of china\n",
    "summary": "pakistan issues coin to mark th anniversary of new china\n"
  },
  {
    "article": "a training aircraft of pakistan s unk air flying club crashed thursday at karachi airport while taking off the civil aviation authorities lrb caa rrb said\n",
    "summary": "pakistani training aircraft crashes at karachi airport\n"
  },
  {
    "article": "sri lanka s nationalist party on thursday protested against the role of the u s government in the island s conflict between the government troops and tamil tiger rebels\n",
    "summary": "sri lankan nationalists protest against u s role in civil war\n"
  },
  {
    "article": "australian prime minister kevin rudd sends his warm congratulation to china and the chinese people on the th anniversary of the people s republic of china\n",
    "summary": "australian pm congratulates china on th anniversary\n"
  },
  {
    "article": "the bangladeshi government has set an export target at billion u s dollars in the current fiscal year lrb july to june rrb which is percent higher than the actual export of fiscal year lrb july to june rrb national news agency bss reported on thursday\n",
    "summary": "bangladesh set unk export target in fiscal year\n"
  },
  {
    "article": "germany government offered assistance to help victims of earthquake in indonesia s west sumatra province a presidential palace spokesman said here on thursday\n",
    "summary": "germany offers aid for quake victims in indonesia\n"
  },
  {
    "article": "the indonesian government started on thursday disbursing the funds allocated to help the victims of a strong earthquake in west sumatra province with initial disbursement of five billion rupiah lrb about u s dollars rrb from total allocation of billion rupiah lrb about million dollars rrb\n",
    "summary": "indonesian gov t starts to disburse aid fund\n"
  },
  {
    "article": "traditional kings and chiefs of cote d ivoire on wednesday have said they will help keep the west african country s electoral process on track\n",
    "summary": "cote d ivoire s traditional leaders vow to support electoral process\n"
  },
  {
    "article": "at least people died in a ship wreckage this week in the river unk of the democratic republic of congo radio okapi reported on thursday\n",
    "summary": "dr congo reports dead in ship wreckage on river unk\n"
  },
  {
    "article": "cote d ivoire s civil society is calling for exemplary sanctions from the international community against the military junta in guinea after the repression of the opposition protest which led to deaths\n",
    "summary": "cote d ivoire s civil society demands exemplary sanctions on guinean junta\n"
  },
  {
    "article": "kenya airways said thursday it has signed a code share agreement with nigerian eagle airlines to strengthen its presence and increase market share in west africa\n",
    "summary": "kenya airways signs code sharing deal with eagle airlines\n"
  },
  {
    "article": "former un chief kofi annan confirmed thursday he will travel to kenya next week to assess progress made in implementation of the agreements that ended the country s post election mayhem\n",
    "summary": "former un chief due in kenya to press for reforms\n"
  },
  {
    "article": "the foreigners and migration services of angola lrb sme rrb said on thursday that it had arrested a total of foreigners who were trying to enter angola s capital luanda illegally\n",
    "summary": "angola arrests illegal immigrants in northern province\n"
  },
  {
    "article": "south africa s governance ratings have slipped two places to ninth in africa the country s press association quoted the harvard university s index of african governance as saying on thursday\n",
    "summary": "south africa slips to th in africa governance ratings\n"
  },
  {
    "article": "an official from the international labor organization lrb ilo rrb has said there was need for stakeholders to recognize the role women played in society the zambian news and information service lrb zanis rrb reported on thursday\n",
    "summary": "ilo calls for recognition of role of women in society\n"
  },
  {
    "article": "at least people including combatants were killed and others wounded on thursday after fierce battles between two main islamist groups in somalia s southern port city which fell to the hardline al shabaab movement medics and residents said\n",
    "summary": "hardline islamist group in somalia kicks rival faction out of southern port city\n"
  },
  {
    "article": "a landmark hotel in los angels has closed down due to disagreement over severance arrangement with its unionized employees the los angeles times reported thursday\n",
    "summary": "los angeles landmark hotel shuts its door after years of catering to throngs of celebrities\n"
  },
  {
    "article": "wall street fell sharply thursday as investors digested weak job numbers and manufacturing expanded at a lower pace than expected\n",
    "summary": "wall street slumps as job manufacturing reports trail estimates\n"
  },
  {
    "article": "european union lrb eu rrb finance ministers on thursday agreed on some principles of an exit strategy to phase out their economic stimulus\n",
    "summary": "eu finance ministers agree on principles of exit strategy\n"
  },
  {
    "article": "the london stock market fell nearly percent in closing on thursday hit by falls to mining stocks and concerns about the slow pace of the u s economic recovery\n",
    "summary": "london stock market falls sharply in closing\n"
  },
  {
    "article": "iranian foreign minister manouchehr mottaki on thursday characterized the meeting between major powers near geneva as constructive and offered continued dialogue at a summit level\n",
    "summary": "iran invites powers to enhanced high level talks\n"
  },
  {
    "article": "cisco systems inc the world s largest networking equipment maker announced on thursday that it has agreed to buy norwegian videoconferencing company tandberg asa for about billion u s dollars in cash a move aimed to expand its products portfolio\n",
    "summary": "cisco to buy norwegian company tandberg for billion u s dollars\n"
  },
  {
    "article": "an israeli diplomat has left moscow after being accused of engaging in unlawful activities a russian foreign ministry spokesman said on thursday\n",
    "summary": "israeli diplomat leaves russia after incident\n"
  },
  {
    "article": "twenty two major banks in the european union lrb eu rrb may register credit loss of billion euros lrb billion u s dollars rrb in and under a worst case scenario results of a eu wide stress test showed on thursday\n",
    "summary": "stress test puts eu banks loss at billion euros in worst case\n"
  },
  {
    "article": "the united states on thursday expressed cautious welcome to the international talks with iran on nuclear issues saying that iran needs to live up to international obligations\n",
    "summary": "u s expressed cautious welcome to int l talks with iran\n"
  },
  {
    "article": "the united nations has rushed teams to indonesia samoa and the philippines to help local governments deal with recent devastating natural disasters said a un spokesperson here thursday\n",
    "summary": "un provides aids to disaster hit indonesia samoa and philippines\n"
  },
  {
    "article": "un secretary general ban ki moon on thursday called for governments to build inclusive societies that emphasize participation unk independence care and dignity for people of all ages especially the elderly\n",
    "summary": "un chief calls for greater state support for elderly\n"
  },
  {
    "article": "crude prices edged higher on thursday as consumer spending improvement outweighed disappointing employment data\n",
    "summary": "oil edges higher on mixed economic data\n"
  },
  {
    "article": "gold futures on the comex division of the new york mercantile exchange managed to close above the key level of u s dollars on thursday despite a decline due to a strong dollar which reduced its appeal\n",
    "summary": "gold declines on stronger dollar\n"
  },
  {
    "article": "unless hungary manages to integrate its roma lrb gypsy rrb communities within the next ten to twenty years it will be unable to achieve sustainable development prime minister gordon bajnai said thursday\n",
    "summary": "roma segregation hungary s worst perspective problem says pm\n"
  },
  {
    "article": "the southeast hungarian city of unk has been chosen as one of the three new centers for european union laser research prime minister gordon bajnai told unk residents on thursday\n",
    "summary": "hungarian city chosen as eu laser research venue\n"
  },
  {
    "article": "the hungarian government is sending a person team thursday to earthquake hit sumatra of indonesia to help search and rescue victims local media reported\n",
    "summary": "hungary sends rescue teams to quake hit sumatra\n"
  },
  {
    "article": "pledging a new beginning for the country greek main opposition pasok leader george papandreou called on greeks thursday night to cast their votes in favor of the socialists in oct general elections and hand them over a wide majority in the new parliament in order to form a strong and steady government\n",
    "summary": "greek main opposition leader calls for change steady gov t before elections\n"
  },
  {
    "article": "u s president barack obama on thursday expressed his concerns and condolences over the causalities caused by tsunami in samoa and american samoa and the earthquake in indonesia pledging to provide full support of the u s government to help the recovery of the countries\n",
    "summary": "obama voices concerns over natural disasters in samoa indonesia\n"
  },
  {
    "article": "the u s house of representatives on thursday passed a resolution to oppose the obama administration s plan to bring detainees at the unk prison to homeland\n",
    "summary": "u s house votes against bringing guantanamo detainees to homeland\n"
  },
  {
    "article": "at least people have been killed in the powerful earthquake that hit the indonesian island of sumatra said the un humanitarian chief here on thursday\n",
    "summary": "indonesia quake toll tops\n"
  },
  {
    "article": "china on thursday welcomed progress made in international talks on iran s nuclear program and called on related parties to continue strengthening diplomatic efforts in pursuit of a comprehensive solution to the iranian nuclear issue\n",
    "summary": "china welcomes progress in talks on iran s nuclear program\n"
  },
  {
    "article": "the second wave of the a h n flu pandemic is coming back to canada as two provinces reported new cases this week health officials said thursday\n",
    "summary": "second wave of a h n flu hits canada\n"
  },
  {
    "article": "macedonia is beginning to withdraw its controversial encyclopedia which has drawn harsh criticism from the albanian community in the western balkans news from skopje reported on thursday\n",
    "summary": "macedonia begins withdrawal of controversial encyclopedia\n"
  },
  {
    "article": "two telecommunications satellites unk and unk are launched into geostationary transfer orbits aboard rocket ariane from the spaceport in french guiana on thursday evening\n",
    "summary": "ariane carries two telecom satellites into space from france\n"
  },
  {
    "article": "california governor arnold schwarzenegger announced on thursday that over million u s dollars in clean air grants have been awarded to southern california\n",
    "summary": "schwarzenegger announces mln usd clean air grants\n"
  },
  {
    "article": "un secretary general ban ki moon on thursday urged global leaders to reach an agreement in december on reducing greenhouse gas emissions\n",
    "summary": "un chief urges global leaders to act for agreement in copenhagen\n"
  },
  {
    "article": "premier of ontario canada dalton mcguinty on thursday hosted a flag raising ceremony and a reception to celebrate the th anniversary of the founding of the people s republic of china\n",
    "summary": "premier of ontario hosts reception marking china s national day\n"
  },
  {
    "article": "central america s three major stock markets closed mixed on thursday\n",
    "summary": "stocks close mixed in central america\n"
  },
  {
    "article": "latin america s three major stock markets ended lower on thursday\n",
    "summary": "stocks end lower in mexico argentina brazil\n"
  },
  {
    "article": "one missing pilot s body has been located after two rafale fighter jets crashed into mediterranean a week ago the french navy said on wednesday\n",
    "summary": "french navy finds missing pilot s body\n"
  },
  {
    "article": "brazil s education minister fernando haddad announced on thursday the postponement of the national university admission exams lrb unk rrb after a local daily reported fraud in the tests\n",
    "summary": "brazil postpones university admission exam due to fraud\n"
  },
  {
    "article": "european union lrb eu rrb countries were expected to reach a deal on an overhaul of financial supervision in the nation bloc by the year end the eu presidency said on thursday\n",
    "summary": "eu eyes year end deal on reform of financial supervision\n"
  },
  {
    "article": "the mexican government will continue to work hard to provide citizens and investors an atmosphere of legal certainty the nation s attorney general s office said on thursday\n",
    "summary": "mexico gov t to continue to work towards legal certainty\n"
  },
  {
    "article": "chinese president hu jintao thursday sent a message of condolences to his indonesia counterpart susilo bambang yudhoyono over the heavy casualties and property losses caused by a strong earthquake in sumatra\n",
    "summary": "president hu expresses condolences over earthquake in indonesia\n"
  },
  {
    "article": "at least supporters of ousted honduran president manuel zelaya on thursday protested the martial law imposed by the post coup government in this honduran capital\n",
    "summary": "zelaya s supporters protest martial law reject dialogue under current situation\n"
  },
  {
    "article": "vehicle sales in brazil hit a record high of units in september up percent from august and percent from the same period in the national motor vehicle distribution federation lrb fenabrave rrb said on thursday\n",
    "summary": "vehicle sales in brazil hit record high in september\n"
  },
  {
    "article": "mexico s peso dropped sharply by percent on thursday to against the u s dollar marking the lowest close rate since july\n",
    "summary": "mexican peso drops pct against usd\n"
  },
  {
    "article": "the ecuadorian electricity and renewable energy minister esteban unk said on thursday that the supply of electricity from colombia to ecuador is normal\n",
    "summary": "ecuador says colombia s electricity supply normal\n"
  },
  {
    "article": "mexico and the united states agreed to cooperate in researches on cancer u s embassy in mexico said in a statement thursday\n",
    "summary": "mexico u s to boost cooperation in cancer researches\n"
  },
  {
    "article": "the authorities in el salvador have given a harsh blow to international organized crimes according to news reaching here from san salvador thursday\n",
    "summary": "salvadoran authorities seize kg of cocaine\n"
  },
  {
    "article": "five children have been died of dengue type infection in nicaragua the country s health authorities said on thursday\n",
    "summary": "children die of dengue infection in nicaragua\n"
  },
  {
    "article": "mexico s largest home loan provider the state run national workers housing fund agency lrb unk rrb is helping to fight the global economic crisis according to a statement from the agency released on wednesday\n",
    "summary": "mexican state run housing lender fights recession\n"
  },
  {
    "article": "mexican president felipe calderon said on thursday the current world economic crisis has stimulated mexicans to boost their unity calling for more efforts to fight the crisis\n",
    "summary": "mexican president calls for more efforts to fight economic crisis\n"
  },
  {
    "article": "kim jong il top leader of the democratic people s republic of korea lrb dprk rrb urged to boost the country s economy through self reliance the official rodong sinmun daily said on thursday\n",
    "summary": "dprk top leader calls for self reliance to boost economy\n"
  },
  {
    "article": "the fourth group of rio national coordinators meeting opened here on thursday the mexican foreign ministry said in a statement\n",
    "summary": "group of rio national coordinators meeting opens in mexico\n"
  },
  {
    "article": "brazil s public sector registered a primary surplus of billion reais lrb billion u s dollars rrb in august up percent from july the central bank said wednesday\n",
    "summary": "public sector surplus up percent in august in brazil\n"
  },
  {
    "article": "a photo show marking the th anniversary of the diplomatic relations between china and the democratic people s republic of korea lrb dprk rrb was opened at pyongyang people s cultural palace on friday\n",
    "summary": "photo show marking dprk china relations held in pyongyang\n"
  },
  {
    "article": "women who experience a unk in their first pregnancy may be at higher risk for complications or adverse outcomes in their next pregnancy a new study has said\n",
    "summary": "unk in first pregnancy raises risk for subsequent pregnancy\n"
  },
  {
    "article": "chinese president hu jintao and russian president dmitry medvedev on thursday sent congratulatory messages to each other to celebrate the th anniversary of the establishment of diplomatic ties\n",
    "summary": "chinese russian leaders hail th anniversary of diplomatic ties\n"
  },
  {
    "article": "chinese and brazilian officials celebrated the th anniversary of the people s republic of china lrb prc rrb on wednesday and thursday and repeated their willingness to further strengthen cooperation between the two nations\n",
    "summary": "chinese brazilian officials celebrate prc s th anniversary reiterate strategic alliance\n"
  },
  {
    "article": "brazil registered a trade surplus of billion u s dollars in september down percent from august and percent from the same period last year the country s ministry of industry trade and development announced thursday\n",
    "summary": "brazil s trade surplus down percent in september\n"
  },
  {
    "article": "chinese ambassador to austria wu ken held a reception on thursday to unk the th anniversary of the founding of the people s republic of china lrb prc rrb\n",
    "summary": "chinese ambassador to austria held reception to mark china s national day\n"
  },
  {
    "article": "chinese fashion designers joining hands with designers from chicago s sister cities in other countries showcased the hottest fall fashion designs wednesday night\n",
    "summary": "chinese designers shine at chicago fashion show\n"
  },
  {
    "article": "the london stock market opened higher on thursday at the start of the fourth quarter\n",
    "summary": "london stock market rises in opening\n"
  },
  {
    "article": "the united states has decided to vaccinate the estimated million illegal immigrants in the country against the a h n flu to prevent the disease from further spreading\n",
    "summary": "u s to offer a h n flu vaccine to illegal immigrants\n"
  },
  {
    "article": "georgia clashed with its breakaway republic of abkhazia in the border area on wednesday night shortly after an eu report said georgia started the war with russia in last august the caucasus press news agency reported on thursday\n",
    "summary": "georgia clashes with unk in border after eu releases report\n"
  },
  {
    "article": "romania s president traian basescu thursday signed a decree to remove social democrat dan nica from the posts of unk prime minister and interior minister said the presidential administration\n",
    "summary": "romanian president signs decree to sack interior minister\n"
  },
  {
    "article": "a new round of international talks aimed at finding a solution to the iranian nuclear issue began thursday on the outskirts of geneva\n",
    "summary": "int l talks on iran s nuclear issue open in geneva\n"
  },
  {
    "article": "the reunions of separated families from south korea and the democratic people s republic of korea lrb dprk rrb ended thursday at mount kumgang resort of the dprk the official news agency kcna said\n",
    "summary": "reunions of separated families from south korea dprk end\n"
  },
  {
    "article": "the world is still in deep economic crisis despite signs of recovery in a few countries commonwealth secretary general kamalesh sharma said wednesday night\n",
    "summary": "world still deep in recession says commonwealth chief\n"
  },
  {
    "article": "european union lrb eu rrb finance ministers started a two day meeting here on thursday with an exit strategy to phase out economic stimulus dominating their first day agenda\n",
    "summary": "eu finance ministers work on exit strategy\n"
  },
  {
    "article": "chairman of the european people s party lrb epp rrb joseph unk congratulated the people s republic of china on its th founding anniversary\n",
    "summary": "unk leader congratulates china on th anniversary\n"
  },
  {
    "article": "spain s car sales in september increased percent compared with the same period in an apparent turning point after a difficult year the associations of car manufacturers lrb anfac rrb and dealerships lrb unk rrb said thursday\n",
    "summary": "spain s car sales increase in september\n"
  },
  {
    "article": "u s and iranian officials met bilaterally on iran s nuclear program in geneva on thursday a u s state department spokesperson confirmed\n",
    "summary": "u s iran hold bilateral discussions on nuclear issue\n"
  },
  {
    "article": "austrian minister of finance josef unk thursday increased the budget deficit forecast for to percent and said it would rise further in\n",
    "summary": "austria s budget deficit to reach nearly percent in\n"
  },
  {
    "article": "wall street fell in early trading thursday as investors digested weak job numbers and better than expected consumer spending\n",
    "summary": "wall street lower as job reports trail estimates\n"
  },
  {
    "article": "the european commission the european union s executive arm is providing million euros lrb million u s dollars rrb to meet initial humanitarian needs of victims after powerful earthquakes hit indonesia\n",
    "summary": "eu offers immediate humanitarian aid for indonesia quake victims\n"
  },
  {
    "article": "the u s construction spending increased percent in august unexpectedly as economists had expected a percent drop in the month according to a report released by the commerce department on thursday\n",
    "summary": "u s construction spending rises percent in august\n"
  }
]

/* in this model we load the next word prediction model which we trained using python           */
const searchWrapper = document.querySelector(".search-input");    /* search input box           */
const inputBox = searchWrapper.querySelector("input");            /* select the input box       */
const suggBox = searchWrapper.querySelector(".autocom-box");      /* select our suggestions box */
const icon = searchWrapper.querySelector(".icon");
let linkTag = searchWrapper.querySelector("a");

/* -------------------- Required variables -------------------- */
let model_from_keras;                         /* here we are going to store loaded trained model from python */
const ALPHA_LEN = 34;                         /* maximum length of alphabet characters */
var sample_len  = 1;                          /* length of each character */
var batch_size  = 64;                         /* the number of samples to work through before updating the internal model parameters.*/
var epochs      = 120;                        /* the number times that the learning algorithm will work through the entire training dataset.*/
var max_len     = 10;                         /* maximum word length */

var words   = [];       /* storing the words from dataset                  */
var words__ = [];       /* storing the words from dataset                  */
let model ;             /* autocompletion and correction at the word level */

var frequences     = {};  /* storing the frequency of each word */
var words_unique   = [];  /* storing the unique words only      */
encoding_arabic    = [];  /* encoder for arabic alphabets       */
decoding_arabic    = [];  /* decoder for arabic alphabet        */
var words_decoder  = {};  /* decoder for the tokenized words from the python model  */
var words_encoder  = {};  /* encoder for the tokenized words from the python model  */
var has            = [];  /* check if the word has a special character inside it    */
var queries = new Set();  /* set representing a cache to store the queries          */
var ranked_freq = []; /* ranked frequency array  */
let total_str   = []; /* total predicted queries */

load();             /* load the models           */
load_tokenizer();   /* load the tokenizer files  */
encoder_decoder();  /* encoder decoder function  */
setup();            /* make a proper setup       */

/* loading the tokenizer file */
function load_tokenizer(){
  /* selecting the document ID */
  document.getElementById('file2')
  .addEventListener('change', function(){
    /* reading the file */
    var f = new FileReader();
    f.onload = function(){
      let res = f.result;
      /* splitting the file */
      let tokenizer_ = res.split('\r\n');
      for(let i in tokenizer_){
        /* storing rach element */
        let element = tokenizer_[i].split(" ");
        words_decoder[element[1]] = parseInt(element[0])
        words_encoder[parseInt(element[0])] = element[1];
      }
    }
    f.readAsText(this.files[0]); 
    console.log(this.files[0]);
  })
}

/* loading the dataset file */
function setup(){
    document.getElementById('file') 
      .addEventListener('change', function() { 
        var fr=new FileReader(); 
        fr.onload=function(){ 
          /* splitting the file */
          result = fr.result;
          /* remove the newline */
          result = result.replace('/\n/g', " ");
          filesize = result.length;
          let delem = ['\r\n' , ' '];
          let result_;
          for(let i in delem){
            /* splitting each word */
            words__ =  result.split(delem[i]);
          }
          /* check the special characters */
          for(let i in words__){
            if(words__[i].includes('.') || words__[i].includes('!') || words__[i].includes('?') || words__[i].includes('؟') || words__[i].includes(',') || words__[i].includes('،')){
              let str = "";
              for(let j in words__[i]){
                if(words__[i][j] != '.' && words__[i][j] != '!' && words__[i][j] != '?' && words__[i][j] != '؟' && words__[i][j] != ','|| words__[i] != '،'){
                  str += words__[i][j];
                }
              }
              has[str] = 1;
            } else{
              has[words__[i]] = 0;
            }
          }
          /* delemiters for the file */
          delimiters = ['\r\n',',','\t',' ','\n',', ', ' ,' , ' , ','?','.','!',';',':','؟','،'];
          for (let i in delimiters){
            length = result.split(delimiters[i]).length
            if(length!=filesize && length>1){
               words=result.split(delimiters[i]);
               result = "";
               for(let j = 0 ; j < words.length ; j++){
                 result += words[j];
                 result += " " ;
               }
            }
          }
          words = result.split(" ");
          let _words = [];
          for(let i in words){
            if(words[i] != ""){
              _words.push(words[i]);
            }
          }
          words = _words;
          for(let i = 0 ; i < words.length ; i++){
            frequences[words[i]] = 0;
          }
          words_unique = [...new Set(words)];
          console.log(words_decoder);
          for(let i = 0 ; i < words.length ; i++){
            frequences[words[i]]++;
          }
          for(let i = 0 ; i < words_unique.length ; i++){
            console.log(words_unique[i] , frequences[words_unique[i]]);
          }
        }
      fr.readAsText(this.files[0]); 
      console.log(this.files[0]);
    })
    /* train the dataset */
    document.getElementById('train')
      .addEventListener('click',async ()=>{
        if(words.length <= 0){
          alert("No dataset");
          return;
        }
        document.getElementById("status").style.display = "block";
        document.getElementById("train").style.display = "none";
        try{
          /* preprocessing 1 stage */
          filtered_words = preprocessing_stage_1(words,max_len);
          /* preprocessing 2 stage give integer values for the words*/
          int_words = preprocessing_stage_2(filtered_words,max_len);
          /* preprocessing stage 3 */
          train_features = preprocessing_stage_3(int_words,max_len,sample_len);
          /* preprocessing stage 4 */
          train_labels = preprocessing_stage_4(int_words,max_len,sample_len);
          /* preprocessing stage 5 */
          train_features = preprocessing_stage_5(train_features,max_len,ALPHA_LEN);
          train_labels = preprocessing_stage_5(train_labels,max_len,ALPHA_LEN);
          model = await create_model(max_len,ALPHA_LEN)
          /* create the model */
          await trainModel(model, train_features, train_labels);
          /* download the model */
          await model.save('downloads://autocorrect_model');
          train_features.dispose();
          train_labels.dispose();
          
        }catch (err){
          alert("No enough GPU space. Please reduce your dataset size.");
        }
        document.getElementById("status").style.display = "none";
        document.getElementById("train").style.display = "block";
        
      })
      /* start entering the query */
      inputBox.onkeyup = (e)=>{
        /* user entered data */
        let userData = e.target.value; 
        let emptyArray = [];
        let flag = false;
        if(userData){
              /* splitting the entered data */
              let splitter = [];
              let _userData = userData;
              splitter = userData.split(" ");
              userData = splitter[splitter.length - 1];
              let pred_features = [];
              let suggestion_box = [];
              let to_show = [];
              /* preprocessing stages for the entered data */
              pred_features.push(userData);
              pred_features = preprocessing_stage_2(pred_features,max_len);
              pred_features = preprocessing_stage_5(pred_features,max_len,ALPHA_LEN);
              /* prediction stage */
              let pred_labels = model.predict(pred_features);
              /* post processing dtages */
              pred_labels = postprocessing_stage_1(pred_labels);
              pred_labels = postprocessing_stage_2(pred_labels,max_len)[0];
              /* storing the first ranked word */
              let first_rank = [];
              for(let i = 0 ; i < pred_labels.length ; i++){
                if(pred_labels[i] != ','){
                  first_rank += pred_labels[i];
                }                 
              }
              if(frequences[String(first_rank)] > 0) {
                suggestion_box.push(first_rank);
                to_show.push(first_rank);
                console.log(emptyArray);
                let ranked_dict = [];
                for(let i = 0 ; i < words_unique.length ; i++){
                  if(words_unique[i].startsWith(userData)){
                    ranked_dict.push(words_unique[i]);
                  }
                }
                /* sort the ranked words */
                for(let i = 0 ; i < ranked_dict.length ; i++){
                  for(let j = i + 1 ; j < ranked_dict.length ; j++){
                    if(frequences[ranked_dict[i]] <= frequences[ranked_dict[j]]){
                      [ranked_dict[i] , ranked_dict[j]] = [ranked_dict[j] , ranked_dict[i]];
                    }
                  }
                }
                for(let i = 0; i < ranked_dict.length ; i++){
                  if(ranked_dict[i] !== String(first_rank)){
                    suggestion_box.push(ranked_dict[i]);
                    to_show.push(ranked_dict[i]);
                  }
                }
                /* next word prediction stage */
                suggestion_box =  nextWordPrediction(to_show , _userData);
                suggestion_box = suggestion_box.map((data)=>{
                  return suggestion_box = `<li>${data}</li>`;
                })
                showSuggestions(suggestion_box);
                searchWrapper.classList.add("active"); //show autocomplete box
                let allList = suggBox.querySelectorAll("li");
                for (let i = 0; i < allList.length; i++) {
                  allList[i].setAttribute("onclick", "select(this)");
                }
            }
        }else{
            searchWrapper.classList.remove("active"); //hide autocomplete box
        }
      } 
   }
/* selection the query function */
function select(element){
    let selectData = element.textContent;
    inputBox.value = selectData;
    icon.onclick = ()=>{
        queries.add(selectData);
        /* incrementing the rank at each click */
        ranked_freq[selectData]++;
        if(Number.isNaN(ranked_freq[selectData])){
          ranked_freq[selectData] = 1;
        }
    }
    searchWrapper.classList.remove("active");
}
/* show the suggestion list */
function showSuggestions(list){
    let listData;
    if(!list.length){
        userValue = inputBox.value;
        listData = `<li>${userValue}</li>`;
    }else{
      listData = list.join('');
    }
    suggBox.innerHTML = listData;
}
/* preprocessing stage 1 */
function preprocessing_stage_1(words,max_len){
    var status = "Preprocessing Data 1";
    console.log(status);
    let filtered_words = [];
    for (let i in words){
       filtered_words.push(words[i]);
    }
    return filtered_words;
  }
/* preprocessing stage 2 */
function preprocessing_stage_2(words,max_len){
    status = "Preprocessing Data 2";
    console.log(status);
    let int_words = [];
    for (let i in words){
      int_words.push(word_to_int(words[i],max_len))
    }
    return int_words;
  }
/* word to int converter */
function word_to_int (word,max_len){
    let encode = [];
    for (let i = 0; i < max_len; i++) {
      if(i<word.length){
        let letter = word.slice(i, i+1);
        encode.push(encoding_arabic[word[i]]);
      }else{
        encode.push(0);
      }
    }
    return encode;
  }
/* int to word converter */
function int_to_word (word,max_len){
    let decode = []
    for (let i = 0; i < max_len; i++) {
      if(word[i]==0){
        decode.push("");
      }else{
        decode.push(decoding_arabic[word[i]]);
      }   
    }
    return decode;
  }
/* preprocessing stage 3 */
function preprocessing_stage_3(words,max_len,sample_len){
    status = "Preprocessing Data 3";
    console.log(status);
    let input_data = [];
    for (let x in words){
      let letters = [];
      for (let y=sample_len+1;y<max_len+1;y++){
        input_data.push(words[x].slice(0,y).concat(Array(max_len-y).fill(0)));
      }
    }
    return input_data;
  }
/* preprocessing stage 4 */
function preprocessing_stage_4(words,max_len,sample_len){
    status = "Preprocessing Data 4";
    console.log(status);
    let output_data = [];
    for (let x in words){
      for (let y=sample_len+1;y<max_len+1;y++){
        output_data.push(words[x]);
      }
    }
    return output_data;
  }
/* preprocessing stage 5 */
  function preprocessing_stage_5(words,max_len,alpha_len){
    status = "Preprocessing Data 5 => ";
    console.log(status , words);
    return tf.oneHot(tf.tensor2d(words,[words.length,max_len],dtype='int32'), alpha_len);
  }
/* post processing stage 1 */
function postprocessing_stage_1(words){
    return words.argMax(-1).arraySync();
  }
/* post processing stage 2 */
function postprocessing_stage_2(words,max_len){
    let results = [];
    for (let i in words){
      results.push(int_to_word(words[i],max_len));
    }
    return results;
  }
/* asyncronous create model function */
async function create_model(max_len,alpha_len){
    var model = tf.sequential();
    await model.add(tf.layers.lstm({
      units:alpha_len*2,
      inputShape:[max_len,alpha_len],
      dropout:0.2,
      recurrentDropout:0.2,
      useBias: true,
      returnSequences:true,
      activation:"relu"
    }))
    await model.add(tf.layers.timeDistributed({
       layer: tf.layers.dense({
        units: alpha_len,
        dropout:0.2,
        activation:"softmax"
      })
    }));
    model.summary();
    return model
  }
/* asyncrounous train model function */
async function trainModel(model, train_features, train_labels) {
    status = "Training Model";
    console.log(status)
    // Prepare the model for training.
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['mse'] 
    })
    await model.fit(train_features, train_labels, {
      epochs,
      batch_size,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training' },
        ['loss', 'mse'],
        { height: 200, callbacks: ['onEpochEnd'] }
      )
    }); 
    return;
  }
/* encoder decoder */
function encoder_decoder(){
    let st = "أ";
    /* storing all possible arabic alphabits */
    let alphabet = "ةأبتثجحخدذرزسشصضطظعغفقكلمنهوياءىؤئ"
    for(let i = 0 ; i < alphabet.length ; i++){
        encoding_arabic[alphabet[i]] = i + 1;
        decoding_arabic[i + 1] = alphabet[i];
        console.log(alphabet[i]);
    }   
     encoding_arabic[' '] = 0;
  }
/* next word prediction function 
* this model is build based on the keras deeplearning with python
* it predicts the 4th word after each 3 words
*/
function nextWordPrediction(data , userData){
    total_str = [];
    let flag = false;
    /* ranked freq for each query */
    for(let i of queries){
      if(i.includes(userData)){
        ranked_freq[i]++;
        if(!Number.isNaN(ranked_freq[i])){
            ranked_freq[i]--;
        }
        if(Number.isNaN(ranked_freq[i])){
          ranked_freq[i] = 1;
         }
        total_str.push(i);
        flag = true;
      }
    }
     for(let c in total_str){
       ranked_freq[total_str[c]]++;
      if(!Number.isNaN(ranked_freq[total_str[c]])){
       ranked_freq[total_str[c]]--;
      }
       if(Number.isNaN(ranked_freq[total_str[c]])){
        ranked_freq[total_str[c]] = 1;
       } 
     }
     /* sort the queries based on the rank */
    if(flag){
      for(let i = 0 ; i < total_str.length ; i++){
        for(let j = i + 1 ; j < total_str.length ; j++){
          if(ranked_freq[total_str[i]] <= ranked_freq[total_str[j]]){
            [total_str[i] , total_str[j]] = [total_str[j] , total_str[i]];
          }
        }
      }
      return total_str;
      total_str = [];
    }else{
      for(let i = 0 ; i < data.length ; i++){
          let str = "";
          let predictClasses , yourClass;
          str += data[i];
          str += " ";
          for(let j = 0 ; j < words.length ; j++){
            if(words__[j] == data[i]){
              let k = j + 1;
              while(!has[words__[k]]){
                str += words__[k];
                str += " ";
                k++;
              }
              let seperater = [];
              seperater = str.split(" ");
              let seq = [];
              let l = seperater.length - 2;
              for(let id = 0 ; id < 3 ; id++){
                seq.push(words_decoder[seperater[l--]]);
              }
              seq.reverse();
              /* predict the 4th word */
              predictClasses = model_from_keras.predict(tf.tensor2d(seq,[1,3],dtype='int32'));
              yourClass = predictClasses.argMax(-1).dataSync()[0];
              console.log(words_decoder[data[i]] , yourClass);
              str += " ";
              str += words_encoder[yourClass];
              total_str.push(str); 
              queries.add(str);
              str = data[i];
              str += " ";
            }
          }
      }
      for(let c in total_str){
        ranked_freq[total_str[c]]++;
        if(!Number.isNaN(ranked_freq[total_str[c]])){
          ranked_freq[total_str[c]]--;
         }       
         if(Number.isNaN(ranked_freq[total_str[c]])){
          ranked_freq[total_str[c]] = 1;
         }
      }
      let arr = userData.split(" ");
      console.log("Arr = ",arr);
      for(let i in arr){
        for(let c of queries){
          if(c.startsWith(arr[i]) && !total_str.includes(c)){
            total_str.push(c);
          }
        }
      }
      for(let i = 0 ; i < total_str.length ; i++){
        ranked_freq[total_str[i]]++;
        if(!Number.isNaN(ranked_freq[total_str[i]])){
          ranked_freq[total_str[i]]--;
         }
        if(Number.isNaN(ranked_freq[total_str[i]])){
          ranked_freq[total_str[i]] = 1;
        }
      }
      for(let i = 0 ; i < total_str.length ; i++){
        for(let j = i + 1 ; j < total_str.length ; j++){
          if(ranked_freq[total_str[i]] <= ranked_freq[total_str[j]]){
            [total_str[i] , total_str[j]] = [total_str[j] , total_str[i]];
          }
        }
      }
      return total_str;
     }
  }
  
  /* load the saved two models */
  async function load(){
     model_from_keras = await tf.loadLayersModel( "http://localhost:8080/_tfjsmodel/model.json");
     console.log(model_from_keras);
     model  = await tf.loadLayersModel( "http://localhost:8080/tfjsmodel_/autocorrect_model_.json");
  }


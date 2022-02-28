
// getting all required elements
const searchWrapper = document.querySelector(".search-input");
const inputBox = searchWrapper.querySelector("input");
const suggBox = searchWrapper.querySelector(".autocom-box");
const icon = searchWrapper.querySelector(".icon");
let linkTag = searchWrapper.querySelector("a");
    import {PythonShell} from 'python-shell';

let webLink;
const ALPHA_LEN = 34;
var sample_len = 1;
var batch_size = 32;
var epochs = 600;
var max_len = 10;
var words = [];
var model = create_model(max_len,ALPHA_LEN);
var frequences = {};
var words_unique = [];
encoding_arabic = [];
decoding_arabic = [];
// if user press any key and release
encoder_decoder();
setup();
function setup(){
    document.getElementById('file') 
      .addEventListener('change', function() { 
        var fr=new FileReader(); 
        fr.onload=function(){ 
          result = fr.result;
          console.log("result = ",result);
          filesize = result.length;
          delimiters = ['\r\n',',','\t',' '];
          document.getElementById('file_name').innerText = "Supported format: csv, tsv, txt.";
          for (let i in delimiters){
            length = result.split(delimiters[i]).length
            if(length!=filesize && length>1){
               words=result.split(delimiters[i]);
               document.getElementById('file_name').innerText = document.getElementById('file').files[0].name
            }
          }
          console.log("words = ");
          for(let i = 0 ; i < words.length ; i++){
            frequences[words[i]] = 0;
          }
          words_unique = [...new Set(words)];
          
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
    document.getElementById('train')
      .addEventListener('click',async ()=>{
        if(words.length<=0){
          alert("No dataset");
          return
        }
        document.getElementById("status").style.display = "block";
        document.getElementById("train").style.display = "none";
        try{
          filtered_words = preprocessing_stage_1(words,max_len);
          console.log(filtered_words);
          int_words = preprocessing_stage_2(filtered_words,max_len);
          console.log(int_words);
          
          train_features = preprocessing_stage_3(int_words,max_len,sample_len);
          console.log(train_features);
          
          train_labels = preprocessing_stage_4(int_words,max_len,sample_len);
          console.log(train_labels);
          
          train_features = preprocessing_stage_5(train_features,max_len,ALPHA_LEN);
          console.log(train_features);
          
          train_labels = preprocessing_stage_5(train_labels,max_len,ALPHA_LEN);
          console.log(train_labels);
          
          model = await create_model(max_len,ALPHA_LEN)
          
          await trainModel(model, train_features, train_labels);
          await model.save('downloads://autocorrect_model');
          //memory management
          
          train_features.dispose();
          train_labels.dispose();
          
        }catch (err){
          alert("No enough GPU space. Please reduce your dataset size.");
        }
        document.getElementById("status").style.display = "none";
        document.getElementById("train").style.display = "block";
        
      })
      inputBox.onkeyup = (e)=>{
        let userData = e.target.value; //user enetered data
        let emptyArray = [];
        if(userData){
            //let pattern = new RegExp("^[A-Za-z]{1,"+max_len+"}$");
           // for(let i = 0 ; i < 2 ; i++){
              let pred_features = [];
              let suggestion_box = [];
              console.log(userData);
              pred_features.push(userData);
              pred_features = preprocessing_stage_2(pred_features,max_len);
              pred_features = preprocessing_stage_5(pred_features,max_len,ALPHA_LEN);
              console.log("pred features = ",pred_features);
              let pred_labels = model.predict(pred_features);
              console.log("<><><><><asfsafsafsafsaf>");
              console.log(pred_labels.arraySync());
              pred_labels = postprocessing_stage_1(pred_labels);
              console.log("<><><><><>");
              //console.log(pred_labels);
              pred_labels = postprocessing_stage_2(pred_labels,max_len)[0];
              console.log(String(pred_labels));
              let first_rank = [];
              for(let i = 0 ; i < pred_labels.length ; i++){
                if(pred_labels[i] != ','){
                  first_rank += pred_labels[i];
                }
              }
              if(frequences[String(first_rank)] > 0) {
                suggestion_box.push(first_rank);
                //suggestion_box.push(' ');
                console.log(emptyArray);
                //showSuggestions(emptyArray);
                let ranked_dict = [];
                for(let i = 0 ; i < words_unique.length ; i++){
                  if(words_unique[i].startsWith(userData)){
                    ranked_dict.push(words_unique[i]);
                  }
                }
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
                    //suggestion_box.push(' ');
                    //searchWrapper.classList.add("active"); //show autocomplete box
                  }
                }
                suggestion_box = suggestion_box.map((data)=>{
                  // passing return data inside li tag
                  return suggestion_box = `<li>${data}</li>`;
                })
                showSuggestions(suggestion_box);
                console.log(suggestion_box)
                searchWrapper.classList.add("active"); //show autocomplete box
                showSuggestions(suggestion_box);
            }
            nextWordPrediction(suggestion_box);

           // }
        }else{
            searchWrapper.classList.remove("active"); //hide autocomplete box
        }
        /*
        let emptyArray = [];
        if(userData){
            icon.onclick = ()=>{
                webLink = `https://www.google.com/search?q=${userData}`;
                linkTag.setAttribute("href", webLink);
                linkTag.click();
            }
            emptyArray = suggestions.filter((data)=>{
                //filtering array value and user characters to lowercase and return only those words which are start with user enetered chars
                return data.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
            });
            emptyArray = emptyArray.map((data)=>{
                // passing return data inside li tag
                return data = `<li>${data}</li>`;
            });
            searchWrapper.classList.add("active"); //show autocomplete box
            showSuggestions(emptyArray);
            let allList = suggBox.querySelectorAll("li");
            for (let i = 0; i < allList.length; i++) {
                //adding onclick attribute in all li tag
                allList[i].setAttribute("onclick", "select(this)");
            }
        }else{
            searchWrapper.classList.remove("active"); //hide autocomplete box
        }*/
      }
      
   }


function select(element){
    let selectData = element.textContent;
    inputBox.value = selectData;
    icon.onclick = ()=>{
        webLink = `https://www.google.com/search?q=${selectData}`;
        linkTag.setAttribute("href", webLink);
        linkTag.click();
    }
    searchWrapper.classList.remove("active");
}
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
function preprocessing_stage_1(words,max_len){
    // function to filter the wordlist 
    // string [] = words
    // int = max_len
    var status = "Preprocessing Data 1";
    console.log(status);
    let filtered_words = [];
    //var pattern = new RegExp("^[A-Za-z]{1,"+max_len+"}$");
    for (let i in words){
      //var is_valid = pattern.test(words[i]);
      //console.log(is_valid);
      //if (is_valid)
       filtered_words.push(words[i]);
      console.log(words[i]);
    }
    return filtered_words;
  }
  function preprocessing_stage_2(words,max_len){
    // function to convert the wordlist to int 
    // string [] = words
    // int = max_len
    status = "Preprocessing Data 2";
    console.log(status);
    let int_words = [];
    for (let i in words){
      int_words.push(word_to_int(words[i],max_len))
    }
    return int_words;
  }
  function word_to_int (word,max_len){
    // char [] = word
    // int = max_len
    let encode = [];
    for (let i = 0; i < max_len; i++) {
      if(i<word.length){
        let letter = word.slice(i, i+1);
        console.log("-->");
        console.log(encoding_arabic[word[i]] , word[i]);
        encode.push(encoding_arabic[word[i]]);
      }else{
        encode.push(0);
      }
    }
    return encode;
  }
  function int_to_word (word,max_len){
    // int [] = word
    // int = max_len
    let decode = []
    for (let i = 0; i < max_len; i++) {
      if(word[i]==0){
        decode.push("");
      }else{
        console.log("word[i] = ")
        console.log(word[i]);
        decode.push(decoding_arabic[word[i]]);
      }
      
    }
    console.log('decode = ');
    console.log(decode);
    return decode;
  }
  function preprocessing_stage_3(words,max_len,sample_len){
    // function to perform sliding window on wordlist
    // int [] = words
    // int = max_len, sample_len
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
  function preprocessing_stage_4(words,max_len,sample_len){
    // function to ensure that training data size y == x
    // int [] = words
    // int = max_len, sample_len
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
  function preprocessing_stage_5(words,max_len,alpha_len){
    // function to convert int to onehot encoding 
    // int [] = words
    // int = max_len, alpha_len
    status = "Preprocessing Data 5";
    console.log(status);
    return tf.oneHot(tf.tensor2d(words,[words.length,max_len],dtype='int32'), alpha_len);
  }
  function postprocessing_stage_1(words){
    //function to decode onehot encoding
    console.log("<><<<<<<<<<-11111111>>>>>>>>>>>>>");
    console.log(words.argMax(1).arraySync());
    console.log("<><<<<<<<<<0000000>>>>>>>>>>>>>");
    console.log(words.argMax(-2).arraySync());

    return words.argMax(-1).arraySync();
  }
  function postprocessing_stage_2(words,max_len){
    //function to convert int to words
    let results = [];
    for (let i in words){
      results.push(int_to_word(words[i],max_len));
    }
    return results;
  }
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

  function encoder_decoder(){
    let st = "أ";
    
    let alphabet = "ةأبتثجحخدذرزسشصضطظعغفقكلمنهوياءىؤئ"
    for(let i = 0 ; i < alphabet.length ; i++){
        encoding_arabic[alphabet[i]] = i + 1;
        decoding_arabic[i + 1] = alphabet[i];
        console.log(alphabet[i]);
        //st++;
    }   
     encoding_arabic[' '] = 0;

    let str = "عبد الرحمان منصور نجوى الحلوة القنص مؤمن ابن دنيا الأمورة";
    for(let i = 0 ; i < str.length ; i++){
        console.log( encoding_arabic[str[i]] , str[i]);
    } 
  }

  async function nextWordPrediction(data){
    /*
    console.log("frmom dunction : " ,data);
    //import * as tf from '@tensorflow/tfjs';
    const model = await tf.loadLayersModel('nextword1.h5');

    console.log(model);
    */

    PythonShell.runString('x=1+1;print(x)', null, function (err) {
      if (err) throw err;
      console.log('finished');
    });


  }
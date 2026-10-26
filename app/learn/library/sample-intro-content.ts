export type Vocab={en:string;vi:string};
export type Task={id:string;kind:"translate"|"dialogue"|"order"|"listenOrder"|"match"|"speak"|"audioMatch";prompt:string;answer:string;vi:string;options?:string[];context?:string;contextVi?:string;pairs?:Vocab[];note:string};
export const SAMPLE_IDS=["70a11000-0000-4000-8000-000000000001","70a11000-0000-4000-8000-000000000002","70a11000-0000-4000-8000-000000000003","70a11000-0000-4000-8000-000000000004"];
export const vocabulary:Vocab[]=[{en:"good morning",vi:"chào buổi sáng"},{en:"good evening",vi:"chào buổi tối"},{en:"welcome",vi:"chào mừng"},{en:"thank you",vi:"cảm ơn bạn"},{en:"hello",vi:"xin chào"},{en:"name",vi:"tên"},{en:"my",vi:"của tôi"},{en:"your",vi:"của bạn"},{en:"meet",vi:"gặp"},{en:"nice",vi:"vui; tốt đẹp"},{en:"years old",vi:"tuổi"},{en:"from",vi:"đến từ"},{en:"live",vi:"sống"},{en:"student",vi:"học sinh"},{en:"like",vi:"thích"},{en:"reading",vi:"đọc sách"},{en:"music",vi:"âm nhạc"},{en:"football",vi:"bóng đá"},{en:"friend",vi:"bạn"}];
const task=(id:string,kind:Task["kind"],prompt:string,answer:string,vi:string,note:string,extra:Partial<Task>={}):Task=>({id,kind,prompt,answer,vi,note,...extra});
const greetings=[{en:"hello",vi:"xin chào"},{en:"name",vi:"tên"},{en:"friend",vi:"bạn"},{en:"meet",vi:"gặp"}];
const personal=[{en:"student",vi:"học sinh"},{en:"from",vi:"đến từ"},{en:"live",vi:"sống"},{en:"years old",vi:"tuổi"}];
const hobbies=[{en:"reading",vi:"đọc sách"},{en:"music",vi:"âm nhạc"},{en:"football",vi:"bóng đá"},{en:"like",vi:"thích"}];
export const sampleLessons=[
 {title:"Lời chào và tên của bạn",newWords:["hello","name","my","your","meet","nice","friend","good morning","good evening","welcome","thank you"],questions:["Hello! What is your name?","Nice to meet you! How do you greet a new friend?"],tasks:[
 task("1a","translate","“Hello” có nghĩa là gì?","Xin chào","Xin chào","Dùng Hello để chào người khác.",{options:["Xin chào","Tạm biệt","Cảm ơn"]}),
 task("1b","order","Ghép câu: Tên tôi là Linh.","My name is Linh","Tên tôi là Linh.","My name is + tên là cách giới thiệu tên."),
 task("1c","dialogue","Điền từ còn thiếu trong lời giới thiệu.","name","tên","My name is… nghĩa là Tên tôi là…",{context:"A: What is your name?\nB: My ___ is Linh.",contextVi:"A: Bạn tên là gì?\nB: Tên tôi là Linh.",options:["name","meet","hello"]}),
 task("1d","listenOrder","Nghe rồi ghép lại lời chào đón.","Good morning and welcome","Chào buổi sáng và chào mừng bạn.","Good morning dùng để chào buổi sáng; welcome là lời chào đón."),
 task("1e","match","Nối từ với nghĩa tiếng Việt.","","","Ghép đúng từng từ và nghĩa.",{pairs:greetings}),
 task("1f","translate","Chọn cách nói “cảm ơn bạn”.","thank you","cảm ơn bạn","Thank you là cách nói cảm ơn lịch sự.",{options:["thank you","goodbye","hello"]}),
 task("1g","dialogue","Hoàn thành lời chào khi gặp bạn mới.","meet","gặp","Nice to meet you là cách chào khi mới gặp.",{context:"A: Hello, I am Mai.\nB: Nice to ___ you.",contextVi:"A: Xin chào, tôi là Mai.\nB: Rất vui được gặp bạn.",options:["meet","name","my"]}),
 task("1h","order","Ghép câu: Rất vui được gặp bạn.","Nice to meet you","Rất vui được gặp bạn.","Nice to meet you được dùng trong lần gặp đầu."),
 task("1i","listenOrder","Nghe và xếp lại lời chào buổi tối.","Good evening my friend","Chào buổi tối, bạn của tôi.","Good evening dùng khi chào ai đó vào buổi tối."),
 task("1j","translate","“This is my friend Mai” có nghĩa là gì?","Đây là bạn Mai của tôi","Đây là bạn Mai của tôi","This is… dùng để giới thiệu một người khác.",{options:["Đây là bạn Mai của tôi","Tên tôi là Mai","Tôi gặp Mai"]})
 ]},
 {title:"Tuổi và nơi bạn sống",newWords:["years old","from","live","student"],questions:["You can invent your details. How old are you?","Where are you from? You can choose an imaginary country."],tasks:[
 task("2a","speak","Nghe rồi đọc lại từ đang hiển thị.","student","học sinh","Student là người đang đi học."),
 task("2b","translate","“I am twelve years old” có nghĩa là gì?","Tôi mười hai tuổi","Tôi mười hai tuổi","I am + số tuổi + years old.",{options:["Tôi mười hai tuổi","Tôi học lớp hai","Tôi có mười hai người bạn"]}),
 task("2c","dialogue","Chọn từ điền vào câu trả lời.","from","đến từ","I am from + quốc gia diễn tả quê quán.",{context:"A: Where are you from?\nB: I am ___ Vietnam.",contextVi:"A: Bạn đến từ đâu?\nB: Tôi đến từ Việt Nam.",options:["from","old","name"]}),
 task("2d","order","Ghép câu: Tôi sống ở Hà Nội.","I live in Hanoi","Tôi sống ở Hà Nội.","Live in + nơi chốn diễn tả nơi đang sống."),
 task("2e","listenOrder","Nghe rồi ghép lại câu.","I am a student","Tôi là học sinh.","Dùng a trước danh từ số ít student."),
 task("2f","speak","Nghe và đọc lại cả câu.","I am from Vietnam","Tôi đến từ Việt Nam.","From diễn tả nơi xuất thân."),
 task("2g","match","Nối các từ về bản thân.","","","Mỗi cụm từ có một nghĩa tương ứng.",{pairs:personal}),
 task("2h","dialogue","Hoàn thành câu nói về tuổi.","old","tuổi","Years old đi sau số tuổi.",{context:"A: How old are you?\nB: I am twelve years ___.",contextVi:"A: Bạn bao nhiêu tuổi?\nB: Tôi mười hai tuổi.",options:["old","from","live"]}),
 task("2i","order","Ghép câu: Tôi sống ở Hà Nội và tôi là học sinh.","I live in Hanoi and I am a student","Tôi sống ở Hà Nội và tôi là học sinh.","And nối thông tin về nơi sống và việc học."),
 task("2j","translate","“Where are you from?” có nghĩa là gì?","Bạn đến từ đâu?","Bạn đến từ đâu?","Where hỏi về nơi chốn.",{options:["Bạn đến từ đâu?","Bạn thích gì?","Bạn tên là gì?"]})
 ]},
 {title:"Sở thích và kết bạn",newWords:["like","reading","music","football"],questions:["What do you like doing in your free time?","Tell your new friend one thing about yourself."],tasks:[
 task("3a","audioMatch","Nghe từng ô rồi nối với nghĩa tiếng Việt.","","","Âm thanh mỗi ô chỉ đọc đúng từ của ô đó.",{pairs:hobbies}),
 task("3b","order","Ghép câu: Tôi thích đọc sách.","I like reading","Tôi thích đọc sách.","Like + động từ đuôi -ing để nói sở thích."),
 task("3c","dialogue","Hoàn thành lời giới thiệu sở thích.","like","thích","I like… diễn tả điều bạn thích.",{context:"A: What do you like?\nB: I ___ music.",contextVi:"A: Bạn thích gì?\nB: Tôi thích âm nhạc.",options:["like","name","from"]}),
 task("3d","speak","Nghe rồi đọc lại cả câu.","I like playing football","Tôi thích chơi bóng đá.","Playing football là chơi bóng đá."),
 task("3e","translate","“reading” có nghĩa là gì?","đọc sách","đọc sách","Reading diễn tả hoạt động đọc.",{options:["đọc sách","hát","chạy"]}),
 task("3f","listenOrder","Nghe rồi xếp lại câu về sở thích.","I like music and reading","Tôi thích âm nhạc và đọc sách.","And nối hai sở thích trong cùng câu."),
 task("3g","audioMatch","Nghe và tìm nghĩa đúng của mỗi ô.","","","Nghe kỹ từng từ rồi chọn nghĩa tương ứng.",{pairs:[{en:"name",vi:"tên"},{en:"student",vi:"học sinh"},{en:"friend",vi:"bạn"},{en:"hello",vi:"xin chào"}]}),
 task("3h","dialogue","Điền hoạt động phù hợp.","reading","đọc sách","Like reading nghĩa là thích đọc sách.",{context:"A: Do you like books?\nB: Yes, I like ___.",contextVi:"A: Bạn có thích sách không?\nB: Có, tôi thích đọc sách.",options:["reading","from","old"]}),
 task("3i","speak","Nghe và đọc lại từ.","music","âm nhạc","Music là âm nhạc."),
 task("3j","translate","Chọn câu nói “Tôi thích chơi bóng đá”.","I like playing football","Tôi thích chơi bóng đá.","Like playing football là thích chơi bóng đá.",{options:["I like playing football","I am from Vietnam","My name is Nam"]})
 ]},
 {title:"Ôn tập: Tự tin giới thiệu bản thân",newWords:[],questions:[],tasks:[
 task("4a","translate","“My name is Linh” có nghĩa là gì?","Tên tôi là Linh","Tên tôi là Linh","My name is… dùng để giới thiệu tên.",{options:["Tên tôi là Linh","Tôi đến từ Linh","Bạn tên là Linh"]}),
 task("4b","dialogue","Điền lời giới thiệu tên.","name","tên","My name is + tên.",{context:"A: What is your name?\nB: My ___ is Nam.",contextVi:"A: Bạn tên là gì?\nB: Tên tôi là Nam.",options:["name","like","live"]}),
 task("4c","order","Ghép câu: Tôi mười hai tuổi.","I am twelve years old","Tôi mười hai tuổi.","Years old dùng để nói số tuổi."),
 task("4d","listenOrder","Nghe rồi ghép câu giới thiệu.","Hello I am Linh and I am from Vietnam","Xin chào, tôi là Linh và tôi đến từ Việt Nam.","And kết nối các thông tin về bản thân."),
 task("4e","match","Ôn lại các từ về bản thân.","","","Đối chiếu đủ bốn cặp từ.",{pairs:personal}),
 task("4f","audioMatch","Nghe và nối nghĩa về sở thích.","","","Nhớ lại từ vựng qua âm thanh.",{pairs:hobbies}),
 task("4g","speak","Nghe và đọc lại từ.","friend","bạn","Friend là bạn."),
 task("4h","speak","Nghe rồi đọc lại câu tự giới thiệu.","Hello I am Nam and I like reading","Xin chào, tôi là Nam và tôi thích đọc sách.","Ghép lời chào, giới thiệu bản thân và sở thích."),
 task("4i","translate","Chọn câu nói “Tôi là học sinh”.","I am a student","Tôi là học sinh.","Dùng a trước student.",{options:["I am a student","I am from student","I like my name"]}),
 task("4j","dialogue","Hoàn thành câu hỏi về quê quán.","from","đến từ","Where are you from? hỏi quê quán.",{context:"A: Where are you ___?\nB: I am from Vietnam.",contextVi:"A: Bạn đến từ đâu?\nB: Tôi đến từ Việt Nam.",options:["from","old","like"]}),
 task("4k","order","Ghép câu: Tôi sống ở Hà Nội và tôi thích âm nhạc.","I live in Hanoi and I like music","Tôi sống ở Hà Nội và tôi thích âm nhạc.","Giới thiệu nơi sống và sở thích trong cùng câu."),
 task("4l","listenOrder","Nghe rồi ghép câu kết thúc phần giới thiệu.","Nice to meet you my new friend","Rất vui được gặp bạn, người bạn mới của tôi.","Nice to meet you thể hiện sự thân thiện.")
 ]}
];

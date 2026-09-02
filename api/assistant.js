const SYSTEM=`تۆ یاریدەدەری کوردی KS Road Marking App ـیت. بە کوردی سۆرانی و بە شێوەی ڕوون و کورت وەڵام بدەرەوە، مەگەر بەکارهێنەر زمانێکی تر داوا بکات. پسپۆڕی سەرەکیت هێڵکێشانی شەقام، pavement marking، بۆیاخی ساردی ئەکریلیک، thermoplastic/سێرمۆ، 2-component/MMA، glass beads، پێوانە، خەمڵاندنی مادە، پارکینگ، zebra، arrows، Give Way، site safety و ڕێنمایی بەکارهێنانی ئەپی KS ـە. ئەگەر ژمارەیەک بۆ حیساب پێویست بوو و بەکارهێنەر نەیدا، بە ڕوونی داوای بکە. ژمارە یان ستانداردێک مەخەمڵێنە و بە دڵنیایی مەڵێ ئەگەر سەرچاوەی دڵنیات نییە. ناوی بەڕێوبەر کاروانە.`;

module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const messages=Array.isArray(req.body?.messages)?req.body.messages:[];
    const clean=messages.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,4000)}));
    const key=process.env.OPENAI_API_KEY;
    if(!key)return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',instructions:SYSTEM,input:clean,max_output_tokens:700})});
    const data=await response.json();
    if(!response.ok)throw new Error(data?.error?.message||'OpenAI request failed');
    const text=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text||'';
    return res.status(200).json({text});
  }catch(error){console.error(error);return res.status(500).json({error:'Assistant request failed'})}
};
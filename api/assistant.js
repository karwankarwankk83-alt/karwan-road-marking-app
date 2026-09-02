const { getVercelOidcToken } = require('@vercel/oidc');

const SYSTEM=`تۆ یاریدەدەری کوردی KS Road Marking App ـیت. بە کوردی سۆرانی و بە شێوەی ڕوون و کورت وەڵام بدەرەوە، مەگەر بەکارهێنەر زمانێکی تر داوا بکات. پسپۆڕی سەرەکیت هێڵکێشانی شەقام، pavement marking، بۆیاخی ساردی ئەکریلیک، thermoplastic/سێرمۆ، 2-component/MMA، glass beads، پێوانە، خەمڵاندنی مادە، پارکینگ، zebra، arrows، Give Way، site safety و ڕێنمایی بەکارهێنانی ئەپی KS ـە. ئەگەر ژمارەیەک بۆ حیساب پێویست بوو و بەکارهێنەر نەیدا، بە ڕوونی داوای بکە. ژمارە یان ستانداردێک مەخەمڵێنە و بە دڵنیایی مەڵێ ئەگەر سەرچاوەی دڵنیات نییە. ناوی بەڕێوبەر کاروانە.`;

module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const messages=Array.isArray(req.body?.messages)?req.body.messages:[];
    const clean=messages.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,4000)}));

    let token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!token){
      try{ token=await getVercelOidcToken(); }
      catch(err){ console.error('OIDC token error:',err); }
    }
    if(!token)return res.status(503).json({error:'AI Gateway authentication is not available'});

    const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':`Bearer ${token}`},
      body:JSON.stringify({
        model:process.env.AI_MODEL||'openai/gpt-5.4',
        messages:[{role:'system',content:SYSTEM},...clean],
        max_tokens:700,
        temperature:0.3
      })
    });

    const raw=await response.text();
    let data={};
    try{data=JSON.parse(raw)}catch{}
    if(!response.ok){
      console.error('AI Gateway error',response.status,raw.slice(0,1000));
      return res.status(502).json({error:'AI Gateway request failed'});
    }
    const text=data?.choices?.[0]?.message?.content||'';
    if(!text)throw new Error('AI Gateway returned an empty response');
    return res.status(200).json({text});
  }catch(error){
    console.error('KS assistant error:',error);
    return res.status(500).json({error:'Assistant request failed'});
  }
};
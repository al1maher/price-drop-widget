var f=`
:host {
  font-family: inherit; 
  --pd-accent: #ffd814;
  --pd-bg: #fff;
  --pd-border: #e0e0e0;
  --pd-radius: 4px;
  display: block;
  width: 100%;
  margin: 0; 
  height: auto;
  min-height: 100%;
  box-sizing: border-box;
}

.pd-container {
  background: var(--pd-bg);
  border: 1px solid var(--pd-border);
  padding: 16px;
  border-radius: var(--pd-radius);
  box-shadow: none; 
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  box-sizing: border-box; 
  justify-content: center;
}

.pd-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.pd-form {
  display: flex;
  gap: 8px;
  width: 100%;
}

.pd-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.pd-input:focus {
  border-color: var(--pd-accent);
}

.pd-btn {
  background: var(--pd-accent);
  color: var(--pd-btn-text, #fff);
  border: none;
  padding: 0 16px;
  border-radius: var(--pd-radius);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  height: 36px; /* Align with input */
  align-self: center;
  font-family: inherit;
}

.pd-btn:hover {
  opacity: 0.9;
}

.pd-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pd-message {
  font-size: 13px;
  margin-top: 4px;
  display: none;
}

.pd-message.success {
  display: block;
  color: #28a745;
}

.pd-message.error {
  display: block;
  color: #d0021b;
}

/* Spinner */
.pd-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Shake animation for errors */
@keyframes pd-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.pd-shake {
  animation: pd-shake 0.5s ease-in-out;
}

/* Hidden form after success */
.pd-hidden {
  display: none;
}

@media (max-width: 480px) {
  .pd-form {
    flex-direction: column;
  }
  .pd-btn {
    width: 100%;
  }
}
`;var p=class extends HTMLElement{constructor(){super();this.config={};this._submitting=!1;this._rendered=!1;this.shadow=this.attachShadow({mode:"open"})}connectedCallback(){this.render()}init(e){this.config={...this.config,...e},this.render()}render(){this.config.product?this.config.product.price==="Unknown"&&!this._rendered&&(console.log("Price was Unknown, re-extracting..."),this.config.product=this.extractPageData()):this.config.product=this.extractPageData();let e=this.config.apiEndpoint||"http://localhost:3000",t="";this.config.accentColor&&(t+=`:host { --pd-accent: ${this.config.accentColor}; }`),this.config.textColor&&(t+=`:host { --pd-btn-text: ${this.config.textColor}; }`),this.shadow.innerHTML=`
    <style>${f} ${t}</style>
    <div class="pd-container">
      <h3 class="pd-title">\u{1F514} Email me if this product gets cheaper</h3>
      <form class="pd-form">
        <input type="email" class="pd-input" placeholder="Enter your email" required value="${this.config.email||""}">
        <button type="submit" class="pd-btn">Track Price</button>
      </form>
      <div class="pd-message"></div>
    </div>
  `,this.form=this.shadow.querySelector("form"),this.input=this.shadow.querySelector("input"),this.btn=this.shadow.querySelector("button"),this.msg=this.shadow.querySelector(".pd-message"),this.form.addEventListener("submit",s=>this.handleSubmit(s,e)),this._rendered=!0,console.log("Current config.product after render:",this.config.product)}extractPageData(){let e=window.location.href,t="Unknown",s="";if(e.includes("amazon.")){let d=['.a-price[data-a-color="price"] .a-offscreen','.a-price[data-a-color="base"] .a-offscreen',"#corePrice_feature_div .a-offscreen",".apexPriceToPay .a-offscreen","#priceblock_ourprice","#priceblock_dealprice",".a-price-whole"];for(let n of d){let o=document.querySelector(n);if(o?.textContent?.trim()){let r=o.textContent.trim();if(r=r.replace(/\s+/g,""),/[\$£€¥]?\d+[.,]\d{2}/.test(r)||/\d+/.test(r)){t=r,console.log(`Found price with selector: ${n}`,t);break}}}if(t==="Unknown"||/^\d+\.$/.test(t)){let n=document.querySelector(".a-price-whole"),o=document.querySelector(".a-price-fraction"),r=document.querySelector(".a-price-symbol");if(n&&o){let l=r?.textContent?.trim()||"$",u=n.textContent?.replace(".","")||"",h=o.textContent||"00";t=`${l}${u}.${h}`,console.log("Constructed price from parts:",t)}}s=document.querySelector("#productTitle")?.textContent?.trim()||document.title}else if(e.includes("ebay.")){let d=[".x-price-primary .ux-textspans",".x-bin-price__content .ux-textspans",".x-price-primary",".x-bin-price__content",'[itemprop="price"]',".display-price"];for(let n of d){let o=document.querySelector(n);if(o?.textContent?.trim()){t=o.textContent.trim();break}}s=document.querySelector(".x-item-title__mainTitle")?.textContent?.trim()||document.title}let i={name:s||document.title,price:t,url:window.location.href};return console.log("Price Drop Widget - Extracted:",i),i}async handleSubmit(e,t){if(e.preventDefault(),this._submitting)return;let s=this.input.value;if(s){if(!this.config.product){console.error("No product data available!"),this.setMessage("error","Could not extract product information.");return}this.setLoading(!0);try{let i=this.config.product,d={email:s,product:{title:i.name,name:i.name,price:i.price,url:i.url}};console.log("Sending payload:",d),console.log("Product data from config:",i);let n=new AbortController,o=setTimeout(()=>n.abort(),1e4);try{let r=await fetch(`${t}/subscribe-price-drop`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d),signal:n.signal});clearTimeout(o);let l=await r.json();console.log("Server response:",l),r.ok?(this.setMessage("success","You are now subscribed!"),this.form.classList.add("pd-hidden"),localStorage.setItem(`pd_sub_${i.url}`,"true")):l.error==="already_subscribed"?this.setMessage("error","You are already tracking this item."):this.setMessage("error","Error: "+(l.error||"Unknown error"))}catch(r){if(clearTimeout(o),r instanceof Error&&r.name==="AbortError")this.setMessage("error","Request timed out. Please try again.");else throw r}}catch(i){console.error("Submit error:",i),this.setMessage("error","Network error. Please try again.")}finally{this.setLoading(!1)}}}setLoading(e){this._submitting=e,e?(this.btn.disabled=!0,this.btn.innerHTML='<span class="pd-spinner"></span> Saving...',this.msg.className="pd-message",this.input.disabled=!0):(this.btn.disabled=!1,this.btn.textContent="Track Price",this.input.disabled=!1)}setMessage(e,t){this.msg.textContent=t,this.msg.className=`pd-message ${e}`,e==="error"&&this.form&&(this.form.classList.remove("pd-shake"),this.form.offsetWidth,this.form.classList.add("pd-shake"))}};customElements.get("price-drop-widget")||customElements.define("price-drop-widget",p);function w(a){let c=document.querySelector("price-drop-widget");if(!c&&a.containerId){let e=document.getElementById(a.containerId);e&&(c=document.createElement("price-drop-widget"),e.innerHTML="",e.appendChild(c))}if(c){if(a.containerId){let e=document.getElementById(a.containerId);e&&(e.style.minHeight="150px",e.style.display="block",e.style.transition="height 0.3s ease")}c.init(a)}}export{p as PriceDropWidget,w as init};
//# sourceMappingURL=price-drop-widget.esm.js.map

import pyperclip

raw_input = """
[https://gyazo.com/acbce49e7e0a8fe6d01d275d7f276697]
[https://gyazo.com/abf4ef9084800135cd259fa961bb5a4c]
[https://gyazo.com/cea47e4daa4e81f7cf45d3786f2318dc]
[https://gyazo.com/26db9c49576a7fc67c17b31687796d22]
[https://gyazo.com/84e902bb711c532aeaa3f35b44e83a66]
[https://gyazo.com/c05fec6853d4bd469d2e2adc29de28bc]
[https://gyazo.com/901270f8484de7d38c2066e7cfaa0529]
[https://gyazo.com/6fd2401e6dc428121d4ad2e5bddf1c70]
[https://gyazo.com/3dd1440ce262e5c65ce021c94ed5909c]
[https://gyazo.com/42d84ca74ac8b8b8f704c2f329d35057]
[https://gyazo.com/149c721c09cbe33825ca7084476814f5]
[https://gyazo.com/1be9b68381eb85520356f3fddf70dfac]
[https://gyazo.com/20f9ed66fe6d99939e814577e0b71224]
[https://gyazo.com/993f36ec47ebe62c8557887a97c4efc4]
[https://gyazo.com/87f699a236dfbc15713d205b658d3c28]
[https://gyazo.com/898f80e6cfb0360d3d8af4f89a999cd2]
[https://gyazo.com/633aef1f28ff8121164b9097743edcb9]
[https://gyazo.com/69294b0f459d561fec77605933bccc64]
[https://gyazo.com/51ce3bae59fff2b048a14b9d7e4ff882]
[https://gyazo.com/c9c5916681915c79cd860216162cd0da]
"""

# 整形処理
lines = [line.strip() for line in raw_input.strip().splitlines() if line.strip()]
chunks = [''.join(lines[i:i+3]) for i in range(0, len(lines), 3)]
result = '\n'.join(chunks)

# 出力
print(result)

# クリップボードにコピー
pyperclip.copy(result)
print("✅ コピーしました！")
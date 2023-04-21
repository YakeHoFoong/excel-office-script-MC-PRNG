// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT

// This is a TypeScript port of some of the contents
// of the following parts of the Numpy library:
// https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/distributions.c
// https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/ziggurat_constants.h

// This module implements unit uniform double and standard normal.

import  {
    IRandomBitsGenerator
} from "./RandomInterface.js";

import {
    Uint64
} from "./LongIntMaths.js";

export {
    RandomDistributions
};

// for conversion to double, copied from Numpy, see
// https://github.com/numpy/numpy/blob/main/numpy/random/_common.pxd
const UINT53_TO_DOUBLE: number =  1.0 / 9007199254740992.0;

// Ziggurate constants from Numpy
// https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/ziggurat_constants.h

const zigguratNorR = 3.6541528853610087963519472518;
const zigguratNorInvR =
    0.27366123732975827203338247596; // 1.0 / zigguratNorR;

const wiDouble: number[] = [
    8.68362706080130616677e-16, 4.77933017572773682428e-17,
    6.35435241740526230246e-17, 7.45487048124769627714e-17,
    8.32936681579309972857e-17, 9.06806040505948228243e-17,
    9.71486007656776183958e-17, 1.02947503142410192108e-16,
    1.08234302884476839838e-16, 1.13114701961090307945e-16,
    1.17663594570229211411e-16, 1.21936172787143633280e-16,
    1.25974399146370927864e-16, 1.29810998862640315416e-16,
    1.33472037368241227547e-16, 1.36978648425712032797e-16,
    1.40348230012423820659e-16, 1.43595294520569430270e-16,
    1.46732087423644219083e-16, 1.49769046683910367425e-16,
    1.52715150035961979750e-16, 1.55578181694607639484e-16,
    1.58364940092908853989e-16, 1.61081401752749279325e-16,
    1.63732852039698532012e-16, 1.66323990584208352778e-16,
    1.68859017086765964015e-16, 1.71341701765596607184e-16,
    1.73775443658648593310e-16, 1.76163319230009959832e-16,
    1.78508123169767272927e-16, 1.80812402857991522674e-16,
    1.83078487648267501776e-16, 1.85308513886180189386e-16,
    1.87504446393738816849e-16, 1.89668097007747596212e-16,
    1.91801140648386198029e-16, 1.93905129306251037069e-16,
    1.95981504266288244037e-16, 1.98031606831281739736e-16,
    2.00056687762733300198e-16, 2.02057915620716538808e-16,
    2.04036384154802118313e-16, 2.05993118874037063144e-16,
    2.07929082904140197311e-16, 2.09845182223703516690e-16,
    2.11742270357603418769e-16, 2.13621152594498681022e-16,
    2.15482589785814580926e-16, 2.17327301775643674990e-16,
    2.19155970504272708519e-16, 2.20969242822353175995e-16,
    2.22767733047895534948e-16, 2.24552025294143552381e-16,
    2.26322675592856786566e-16, 2.28080213834501706782e-16,
    2.29825145544246839061e-16, 2.31557953510408037008e-16,
    2.33279099280043561128e-16, 2.34989024534709550938e-16,
    2.36688152357916037468e-16, 2.38376888404542434981e-16,
    2.40055621981350627349e-16, 2.41724727046750252175e-16,
    2.43384563137110286400e-16, 2.45035476226149539878e-16,
    2.46677799523270498158e-16, 2.48311854216108767769e-16,
    2.49937950162045242375e-16, 2.51556386532965786439e-16,
    2.53167452417135826983e-16, 2.54771427381694417303e-16,
    2.56368581998939683749e-16, 2.57959178339286723500e-16,
    2.59543470433517070146e-16, 2.61121704706701939097e-16,
    2.62694120385972564623e-16, 2.64260949884118951286e-16,
    2.65822419160830680292e-16, 2.67378748063236329361e-16,
    2.68930150647261591777e-16, 2.70476835481199518794e-16,
    2.72019005932773206655e-16, 2.73556860440867908686e-16,
    2.75090592773016664571e-16, 2.76620392269639032183e-16,
    2.78146444075954410103e-16, 2.79668929362423005309e-16,
    2.81188025534502074329e-16, 2.82703906432447923059e-16,
    2.84216742521840606520e-16, 2.85726701075460149289e-16,
    2.87233946347097994381e-16, 2.88738639737848191815e-16,
    2.90240939955384233230e-16, 2.91741003166694553259e-16,
    2.93238983144718163965e-16, 2.94735031409293489611e-16,
    2.96229297362806647792e-16, 2.97721928420902891115e-16,
    2.99213070138601307081e-16, 3.00702866332133102993e-16,
    3.02191459196806151971e-16, 3.03678989421180184427e-16,
    3.05165596297821922381e-16, 3.06651417830895451744e-16,
    3.08136590840829717032e-16, 3.09621251066292253306e-16,
    3.11105533263689296831e-16, 3.12589571304399892784e-16,
    3.14073498269944617203e-16, 3.15557446545280064031e-16,
    3.17041547910402852545e-16, 3.18525933630440648871e-16,
    3.20010734544401137886e-16, 3.21496081152744704901e-16,
    3.22982103703941557538e-16, 3.24468932280169778077e-16,
    3.25956696882307838340e-16, 3.27445527514370671802e-16,
    3.28935554267536967851e-16, 3.30426907403912838589e-16,
    3.31919717440175233652e-16, 3.33414115231237245918e-16,
    3.34910232054077845412e-16, 3.36408199691876507948e-16,
    3.37908150518594979994e-16, 3.39410217584148914282e-16,
    3.40914534700312603713e-16, 3.42421236527501816058e-16,
    3.43930458662583133920e-16, 3.45442337727858401604e-16,
    3.46957011461378353333e-16, 3.48474618808741370700e-16,
    3.49995300016538099813e-16, 3.51519196727607440975e-16,
    3.53046452078274009054e-16, 3.54577210797743572160e-16,
    3.56111619309838843415e-16, 3.57649825837265051035e-16,
    3.59191980508602994994e-16, 3.60738235468235137839e-16,
    3.62288744989419151904e-16, 3.63843665590734438546e-16,
    3.65403156156136995766e-16, 3.66967378058870090021e-16,
    3.68536495289491401456e-16, 3.70110674588289834952e-16,
    3.71690085582382297792e-16, 3.73274900927794352614e-16,
    3.74865296456848868882e-16, 3.76461451331202869131e-16,
    3.78063548200896037651e-16, 3.79671773369794425924e-16,
    3.81286316967837738238e-16, 3.82907373130524317507e-16,
    3.84535140186095955858e-16, 3.86169820850914927119e-16,
    3.87811622433558721164e-16, 3.89460757048192620674e-16,
    3.91117441837820542060e-16, 3.92781899208054153270e-16,
    3.94454357072087711446e-16, 3.96135049107613542983e-16,
    3.97824215026468259474e-16, 3.99522100857856502444e-16,
    4.01228959246062907451e-16, 4.02945049763632792393e-16,
    4.04670639241074995115e-16, 4.06406002114225038723e-16,
    4.08151420790493873480e-16, 4.09907186035326643447e-16,
    4.11673597380302570170e-16, 4.13450963554423599878e-16,
    4.15239602940268833891e-16, 4.17039844056831587498e-16,
    4.18852026071011229572e-16, 4.20676499339901510978e-16,
    4.22513625986204937320e-16, 4.24363780509307796137e-16,
    4.26227350434779809917e-16, 4.28104737005311666397e-16,
    4.29996355916383230161e-16, 4.31902638100262944617e-16,
    4.33824030562279080411e-16, 4.35760997273684900553e-16,
    4.37714020125858747008e-16, 4.39683599951052137423e-16,
    4.41670257615420348435e-16, 4.43674535190656726604e-16,
    4.45696997211204306674e-16, 4.47738232024753387312e-16,
    4.49798853244554968009e-16, 4.51879501313005876278e-16,
    4.53980845187003400947e-16, 4.56103584156742206384e-16,
    4.58248449810956667052e-16, 4.60416208163115281428e-16,
    4.62607661954784567754e-16, 4.64823653154320737780e-16,
    4.67065065671263059081e-16, 4.69332828309332890697e-16,
    4.71627917983835129766e-16, 4.73951363232586715165e-16,
    4.76304248053313737663e-16, 4.78687716104872284247e-16,
    4.81102975314741720538e-16, 4.83551302941152515162e-16,
    4.86034051145081195402e-16, 4.88552653135360343280e-16,
    4.91108629959526955862e-16, 4.93703598024033454728e-16,
    4.96339277440398725619e-16, 4.99017501309182245754e-16,
    5.01740226071808946011e-16, 5.04509543081872748637e-16,
    5.07327691573354207058e-16, 5.10197073234156184149e-16,
    5.13120268630678373200e-16, 5.16100055774322824569e-16,
    5.19139431175769859873e-16, 5.22241633800023428760e-16,
    5.25410172417759732697e-16, 5.28648856950494511482e-16,
    5.31961834533840037535e-16, 5.35353631181649688145e-16,
    5.38829200133405320160e-16, 5.42393978220171234073e-16,
    5.46053951907478041166e-16, 5.49815735089281410703e-16,
    5.53686661246787600374e-16, 5.57674893292657647836e-16,
    5.61789555355541665830e-16, 5.66040892008242216739e-16,
    5.70440462129138908417e-16, 5.75001376891989523684e-16,
    5.79738594572459365014e-16, 5.84669289345547900201e-16,
    5.89813317647789942685e-16, 5.95193814964144415532e-16,
    6.00837969627190832234e-16, 6.06778040933344851394e-16,
    6.13052720872528159123e-16, 6.19708989458162555387e-16,
    6.26804696330128439415e-16, 6.34412240712750598627e-16,
    6.42623965954805540945e-16, 6.51560331734499356881e-16,
    6.61382788509766415145e-16, 6.72315046250558662913e-16,
    6.84680341756425875856e-16, 6.98971833638761995415e-16,
    7.15999493483066421560e-16, 7.37242430179879890722e-16,
    7.65893637080557275482e-16, 8.11384933765648418565e-16];

const fiDouble: number[] = [
    1.00000000000000000000e+00, 9.77101701267671596263e-01,
    9.59879091800106665211e-01, 9.45198953442299649730e-01,
    9.32060075959230460718e-01, 9.19991505039347012840e-01,
    9.08726440052130879366e-01, 8.98095921898343418910e-01,
    8.87984660755833377088e-01, 8.78309655808917399966e-01,
    8.69008688036857046555e-01, 8.60033621196331532488e-01,
    8.51346258458677951353e-01, 8.42915653112204177333e-01,
    8.34716292986883434679e-01, 8.26726833946221373317e-01,
    8.18929191603702366642e-01, 8.11307874312656274185e-01,
    8.03849483170964274059e-01, 7.96542330422958966274e-01,
    7.89376143566024590648e-01, 7.82341832654802504798e-01,
    7.75431304981187174974e-01, 7.68637315798486264740e-01,
    7.61953346836795386565e-01, 7.55373506507096115214e-01,
    7.48892447219156820459e-01, 7.42505296340151055290e-01,
    7.36207598126862650112e-01, 7.29995264561476231435e-01,
    7.23864533468630222401e-01, 7.17811932630721960535e-01,
    7.11834248878248421200e-01, 7.05928501332754310127e-01,
    7.00091918136511615067e-01, 6.94321916126116711609e-01,
    6.88616083004671808432e-01, 6.82972161644994857355e-01,
    6.77388036218773526009e-01, 6.71861719897082099173e-01,
    6.66391343908750100056e-01, 6.60975147776663107813e-01,
    6.55611470579697264149e-01, 6.50298743110816701574e-01,
    6.45035480820822293424e-01, 6.39820277453056585060e-01,
    6.34651799287623608059e-01, 6.29528779924836690007e-01,
    6.24450015547026504592e-01, 6.19414360605834324325e-01,
    6.14420723888913888899e-01, 6.09468064925773433949e-01,
    6.04555390697467776029e-01, 5.99681752619125263415e-01,
    5.94846243767987448159e-01, 5.90047996332826008015e-01,
    5.85286179263371453274e-01, 5.80559996100790898232e-01,
    5.75868682972353718164e-01, 5.71211506735253227163e-01,
    5.66587763256164445025e-01, 5.61996775814524340831e-01,
    5.57437893618765945014e-01, 5.52910490425832290562e-01,
    5.48413963255265812791e-01, 5.43947731190026262382e-01,
    5.39511234256952132426e-01, 5.35103932380457614215e-01,
    5.30725304403662057062e-01, 5.26374847171684479008e-01,
    5.22052074672321841931e-01, 5.17756517229756352272e-01,
    5.13487720747326958914e-01, 5.09245245995747941592e-01,
    5.05028667943468123624e-01, 5.00837575126148681903e-01,
    4.96671569052489714213e-01, 4.92530263643868537748e-01,
    4.88413284705458028423e-01, 4.84320269426683325253e-01,
    4.80250865909046753544e-01, 4.76204732719505863248e-01,
    4.72181538467730199660e-01, 4.68180961405693596422e-01,
    4.64202689048174355069e-01, 4.60246417812842867345e-01,
    4.56311852678716434184e-01, 4.52398706861848520777e-01,
    4.48506701507203064949e-01, 4.44635565395739396077e-01,
    4.40785034665803987508e-01, 4.36954852547985550526e-01,
    4.33144769112652261445e-01, 4.29354541029441427735e-01,
    4.25583931338021970170e-01, 4.21832709229495894654e-01,
    4.18100649837848226120e-01, 4.14387534040891125642e-01,
    4.10693148270188157500e-01, 4.07017284329473372217e-01,
    4.03359739221114510510e-01, 3.99720314980197222177e-01,
    3.96098818515832451492e-01, 3.92495061459315619512e-01,
    3.88908860018788715696e-01, 3.85340034840077283462e-01,
    3.81788410873393657674e-01, 3.78253817245619183840e-01,
    3.74736087137891138443e-01, 3.71235057668239498696e-01,
    3.67750569779032587814e-01, 3.64282468129004055601e-01,
    3.60830600989648031529e-01, 3.57394820145780500731e-01,
    3.53974980800076777232e-01, 3.50570941481406106455e-01,
    3.47182563956793643900e-01, 3.43809713146850715049e-01,
    3.40452257044521866547e-01, 3.37110066637006045021e-01,
    3.33783015830718454708e-01, 3.30470981379163586400e-01,
    3.27173842813601400970e-01, 3.23891482376391093290e-01,
    3.20623784956905355514e-01, 3.17370638029913609834e-01,
    3.14131931596337177215e-01, 3.10907558126286509559e-01,
    3.07697412504292056035e-01, 3.04501391976649993243e-01,
    3.01319396100803049698e-01, 2.98151326696685481377e-01,
    2.94997087799961810184e-01, 2.91856585617095209972e-01,
    2.88729728482182923521e-01, 2.85616426815501756042e-01,
    2.82516593083707578948e-01, 2.79430141761637940157e-01,
    2.76356989295668320494e-01, 2.73297054068577072172e-01,
    2.70250256365875463072e-01, 2.67216518343561471038e-01,
    2.64195763997261190426e-01, 2.61187919132721213522e-01,
    2.58192911337619235290e-01, 2.55210669954661961700e-01,
    2.52241126055942177508e-01, 2.49284212418528522415e-01,
    2.46339863501263828249e-01, 2.43408015422750312329e-01,
    2.40488605940500588254e-01, 2.37581574431238090606e-01,
    2.34686861872330010392e-01, 2.31804410824338724684e-01,
    2.28934165414680340644e-01, 2.26076071322380278694e-01,
    2.23230075763917484855e-01, 2.20396127480151998723e-01,
    2.17574176724331130872e-01, 2.14764175251173583536e-01,
    2.11966076307030182324e-01, 2.09179834621125076977e-01,
    2.06405406397880797353e-01, 2.03642749310334908452e-01,
    2.00891822494656591136e-01, 1.98152586545775138971e-01,
    1.95425003514134304483e-01, 1.92709036903589175926e-01,
    1.90004651670464985713e-01, 1.87311814223800304768e-01,
    1.84630492426799269756e-01, 1.81960655599522513892e-01,
    1.79302274522847582272e-01, 1.76655321443734858455e-01,
    1.74019770081838553999e-01, 1.71395595637505754327e-01,
    1.68782774801211288285e-01, 1.66181285764481906364e-01,
    1.63591108232365584074e-01, 1.61012223437511009516e-01,
    1.58444614155924284882e-01, 1.55888264724479197465e-01,
    1.53343161060262855866e-01, 1.50809290681845675763e-01,
    1.48286642732574552861e-01, 1.45775208005994028060e-01,
    1.43274978973513461566e-01, 1.40785949814444699690e-01,
    1.38308116448550733057e-01, 1.35841476571253755301e-01,
    1.33386029691669155683e-01, 1.30941777173644358090e-01,
    1.28508722279999570981e-01, 1.26086870220185887081e-01,
    1.23676228201596571932e-01, 1.21276805484790306533e-01,
    1.18888613442910059947e-01, 1.16511665625610869035e-01,
    1.14145977827838487895e-01, 1.11791568163838089811e-01,
    1.09448457146811797824e-01, 1.07116667774683801961e-01,
    1.04796225622487068629e-01, 1.02487158941935246892e-01,
    1.00189498768810017482e-01, 9.79032790388624646338e-02,
    9.56285367130089991594e-02, 9.33653119126910124859e-02,
    9.11136480663737591268e-02, 8.88735920682758862021e-02,
    8.66451944505580717859e-02, 8.44285095703534715916e-02,
    8.22235958132029043366e-02, 8.00305158146630696292e-02,
    7.78493367020961224423e-02, 7.56801303589271778804e-02,
    7.35229737139813238622e-02, 7.13779490588904025339e-02,
    6.92451443970067553879e-02, 6.71246538277884968737e-02,
    6.50165779712428976156e-02, 6.29210244377581412456e-02,
    6.08381083495398780614e-02, 5.87679529209337372930e-02,
    5.67106901062029017391e-02, 5.46664613248889208474e-02,
    5.26354182767921896513e-02, 5.06177238609477817000e-02,
    4.86135532158685421122e-02, 4.66230949019303814174e-02,
    4.46465522512944634759e-02, 4.26841449164744590750e-02,
    4.07361106559409394401e-02, 3.88027074045261474722e-02,
    3.68842156885673053135e-02, 3.49809414617161251737e-02,
    3.30932194585785779961e-02, 3.12214171919203004046e-02,
    2.93659397581333588001e-02, 2.75272356696031131329e-02,
    2.57058040085489103443e-02, 2.39022033057958785407e-02,
    2.21170627073088502113e-02, 2.03510962300445102935e-02,
    1.86051212757246224594e-02, 1.68800831525431419000e-02,
    1.51770883079353092332e-02, 1.34974506017398673818e-02,
    1.18427578579078790488e-02, 1.02149714397014590439e-02,
    8.61658276939872638800e-03, 7.05087547137322242369e-03,
    5.52240329925099155545e-03, 4.03797259336302356153e-03,
    2.60907274610215926189e-03, 1.26028593049859797236e-03];

const kiRaw: number[][] = [
    [0xEF6A, 0x8025, 0xF33D, 0x000E], [0x0000, 0x0000, 0x0000, 0x0000], [0xC6A8, 0x98FB, 0x08BE, 0x000C],
    [0x8142, 0xFABD, 0xA354, 0x000D], [0xEEEA, 0x7EC1, 0x51F6, 0x000E], [0xF77E, 0xE9D3, 0xB255, 0x000E],
    [0xCAB9, 0x817E, 0xEF4B, 0x000E], [0x44AA, 0x0AFA, 0x1947, 0x000F], [0xCB18, 0x61FF, 0x37ED, 0x000F],
    [0x255C, 0x9561, 0x4F46, 0x000F], [0xA396, 0xE41B, 0x61A5, 0x000F], [0x96A4, 0x7553, 0x707A, 0x000F],
    [0x449A, 0xEC28, 0x7CB2, 0x000F], [0x57D3, 0x0C63, 0x86F1, 0x000F], [0x25DE, 0x5783, 0x8FA6, 0x000F],
    [0xD0DA, 0xC74D, 0x9724, 0x000F], [0xF509, 0x07DB, 0x9DA9, 0x000F], [0xFA74, 0xF581, 0xA360, 0x000F],
    [0x4BF8, 0xDE5B, 0xA86F, 0x000F], [0x54DC, 0x60D3, 0xACF1, 0x000F], [0xB90F, 0x6718, 0xB0FB, 0x000F],
    [0x74C6, 0x8D53, 0xB49F, 0x000F], [0xFE77, 0x2366, 0xB7EC, 0x000F], [0xE50E, 0xE9A1, 0xBAEC, 0x000F],
    [0x0BED, 0x9D04, 0xBDAB, 0x000F], [0x6C57, 0x60FF, 0xC030, 0x000F], [0xA248, 0x1037, 0xC282, 0x000F],
    [0x5BD1, 0x7AE2, 0xC4A6, 0x000F], [0xEE31, 0x977A, 0xC6A2, 0x000F], [0x96A4, 0xA928, 0xC87A, 0x000F],
    [0xDE85, 0x5E4B, 0xCA32, 0x000F], [0x231A, 0xE902, 0xCBCC, 0x000F], [0x39C4, 0x12F8, 0xCD4D, 0x000F],
    [0xEC99, 0x4D8F, 0xCEB5, 0x000F], [0xC930, 0xBF1D, 0xD007, 0x000F], [0xC4E6, 0x4DD6, 0xD146, 0x000F],
    [0xF450, 0xA8E2, 0xD272, 0x000F], [0xC91E, 0x4FF0, 0xD38E, 0x000F], [0xB478, 0x9990, 0xD49A, 0x000F],
    [0x0F53, 0xB892, 0xD598, 0x000F], [0x99EC, 0xC08E, 0xD689, 0x000F], [0xE832, 0xA9C8, 0xD76E, 0x000F],
    [0x08E8, 0x547B, 0xD848, 0x000F], [0x2C8C, 0x8BAD, 0xD917, 0x000F], [0xADD2, 0x07A7, 0xD9DD, 0x000F],
    [0x5E8C, 0x7010, 0xDA99, 0x000F], [0x2E20, 0x5DC0, 0xDB4D, 0x000F], [0xFCD0, 0x5C5B, 0xDBF9, 0x000F],
    [0x9A7D, 0xEBB9, 0xDC9D, 0x000F], [0x729D, 0x8118, 0xDD3B, 0x000F], [0x2F90, 0x8834, 0xDDD2, 0x000F],
    [0x9F64, 0x6436, 0xDE63, 0x000F], [0x514E, 0x708D, 0xDEEE, 0x000F], [0xB42E, 0x01A6, 0xDF74, 0x000F],
    [0xED40, 0x6599, 0xDFF4, 0x000F], [0x24F2, 0xE4BC, 0xE06F, 0x000F], [0xA258, 0xC225, 0xE0E6, 0x000F],
    [0xB84C, 0x3C28, 0xE159, 0x000F], [0x3F99, 0x8CBC, 0xE1C7, 0x000F], [0x1CAA, 0xE9DB, 0xE231, 0x000F],
    [0x1B91, 0x85DA, 0xE298, 0x000F], [0x4186, 0x8FB5, 0xE2FB, 0x000F], [0x8D4A, 0x3355, 0xE35B, 0x000F],
    [0x002A, 0x99D0, 0xE3B7, 0x000F], [0xAD7F, 0xE99E, 0xE410, 0x000F], [0x7734, 0x46D4, 0xE467, 0x000F],
    [0x095C, 0xD34C, 0xE4BA, 0x000F], [0x9524, 0xAED2, 0xE50B, 0x000F], [0xBC78, 0xF74E, 0xE559, 0x000F],
    [0x1212, 0xC8E4, 0xE5A5, 0x000F], [0x8689, 0x3E13, 0xE5EF, 0x000F], [0x1078, 0x6FD9, 0xE636, 0x000F],
    [0xD578, 0x75C6, 0xE67B, 0x000F], [0x11AA, 0x661E, 0xE6BE, 0x000F], [0xF4F2, 0x55E5, 0xE6FF, 0x000F],
    [0xA702, 0x5900, 0xE73E, 0x000F], [0x9E39, 0x823E, 0xE77B, 0x000F], [0x70A2, 0xE370, 0xE7B6, 0x000F],
    [0x4243, 0x8D77, 0xE7F0, 0x000F], [0xF08C, 0x9053, 0xE828, 0x000F], [0x173A, 0xFB35, 0xE85E, 0x000F],
    [0x0864, 0xDC84, 0xE893, 0x000F], [0xCEBC, 0x41F0, 0xE8C7, 0x000F], [0x4EF6, 0x387D, 0xE8F9, 0x000F],
    [0x9B1D, 0xCC87, 0xE929, 0x000F], [0x88EA, 0x09D3, 0xE959, 0x000F], [0x9AA2, 0xFB93, 0xE986, 0x000F],
    [0x4866, 0xAC71, 0xE9B3, 0x000F], [0xB6D5, 0x2694, 0xE9DF, 0x000F], [0xE67C, 0x73AB, 0xEA09, 0x000F],
    [0x66A4, 0x9CF1, 0xEA32, 0x000F], [0x952C, 0xAB32, 0xEA5A, 0x000F], [0x741A, 0xA6D5, 0xEA81, 0x000F],
    [0x1CF0, 0x97DE, 0xEAA7, 0x000F], [0xD920, 0x85F3, 0xEACC, 0x000F], [0xE63C, 0x7865, 0xEAF0, 0x000F],
    [0xEC13, 0x762F, 0xEB13, 0x000F], [0x2A4A, 0x85FE, 0xEB35, 0x000F], [0x62B4, 0xAE31, 0xEB56, 0x000F],
    [0x84FA, 0xF4E2, 0xEB76, 0x000F], [0x2014, 0x5FE6, 0xEB96, 0x000F], [0x9D7C, 0xF4CF, 0xEBB4, 0x000F],
    [0x49D0, 0xB8F4, 0xEBD2, 0x000F], [0x2E3E, 0xB16E, 0xEBEF, 0x000F], [0xBDE8, 0xE31E, 0xEC0B, 0x000F],
    [0x5A15, 0x52B1, 0xEC27, 0x000F], [0xAFD3, 0x049D, 0xEC42, 0x000F], [0xF196, 0xFD29, 0xEC5B, 0x000F],
    [0xEEF4, 0x406C, 0xEC75, 0x000F], [0x0CB4, 0xD250, 0xEC8D, 0x000F], [0x1F12, 0xB691, 0xECA5, 0x000F],
    [0x27FE, 0xF0C4, 0xECBC, 0x000F], [0xFB15, 0x8454, 0xECD3, 0x000F], [0xC8B3, 0x7488, 0xECE9, 0x000F],
    [0x91B7, 0xC47F, 0xECFE, 0x000F], [0x8528, 0x7735, 0xED13, 0x000F], [0x4903, 0x8F84, 0xED27, 0x000F],
    [0x2F4C, 0x1024, 0xED3B, 0x000F], [0x586E, 0xFBAD, 0xED4D, 0x000F], [0xC3DD, 0x5498, 0xED60, 0x000F],
    [0x4FE8, 0x1D41, 0xED72, 0x000F], [0xA982, 0x57E4, 0xED83, 0x000F], [0x2CC8, 0x06A4, 0xED94, 0x000F],
    [0xB704, 0x2B85, 0xEDA4, 0x000F], [0x6AB4, 0xC874, 0xEDB3, 0x000F], [0x6652, 0xDF41, 0xEDC2, 0x000F],
    [0x6E52, 0x71A4, 0xEDD1, 0x000F], [0x8AD3, 0x813C, 0xEDDF, 0x000F], [0x9980, 0x0F90, 0xEDED, 0x000F],
    [0xD414, 0x1E0F, 0xEDFA, 0x000F], [0x4BC4, 0xAE12, 0xEE06, 0x000F], [0x5A06, 0xC0D9, 0xEE12, 0x000F],
    [0x06E0, 0x5790, 0xEE1E, 0x000F], [0x6524, 0x734B, 0xEE29, 0x000F], [0xE4BC, 0x150A, 0xEE34, 0x000F],
    [0x9B3C, 0x3DB8, 0xEE3E, 0x000F], [0x82F4, 0xEE29, 0xEE47, 0x000F], [0xB086, 0x271D, 0xEE51, 0x000F],
    [0x7F41, 0xE940, 0xEE59, 0x000F], [0xB42E, 0x3528, 0xEE62, 0x000F], [0x97F1, 0x0B58, 0xEE6A, 0x000F],
    [0x077A, 0x6C3E, 0xEE71, 0x000F], [0x7B82, 0x5832, 0xEE78, 0x000F], [0x06BA, 0xCF7B, 0xEE7E, 0x000F],
    [0x4AB2, 0xD248, 0xEE84, 0x000F], [0x6343, 0x60B6, 0xEE8A, 0x000F], [0xC851, 0x7ACC, 0xEE8F, 0x000F],
    [0x25DA, 0x207E, 0xEE94, 0x000F], [0x29EA, 0x51A8, 0xEE98, 0x000F], [0x485C, 0x0E13, 0xEE9C, 0x000F],
    [0x73F4, 0x5572, 0xEE9F, 0x000F], [0xCCAE, 0x2762, 0xEEA2, 0x000F], [0x42AC, 0x836B, 0xEEA4, 0x000F],
    [0x2D71, 0x68FC, 0xEEA6, 0x000F], [0xD6FA, 0xD76E, 0xEEA7, 0x000F], [0xFA0A, 0xCE04, 0xEEA8, 0x000F],
    [0x333B, 0x4BE8, 0xEEA9, 0x000F], [0x6410, 0x5029, 0xEEA9, 0x000F], [0x075E, 0xD9C0, 0xEEA8, 0x000F],
    [0x7654, 0xE789, 0xEEA7, 0x000F], [0x1D24, 0x7848, 0xEEA6, 0x000F], [0x9E83, 0x8AA2, 0xEEA4, 0x000F],
    [0xE4DA, 0x1D22, 0xEEA2, 0x000F], [0x2024, 0x2E35, 0xEE9F, 0x000F], [0xAF2E, 0xBC26, 0xEE9B, 0x000F],
    [0xF2E4, 0xC524, 0xEE97, 0x000F], [0x0A3A, 0x473C, 0xEE93, 0x000F], [0x7516, 0x4055, 0xEE8E, 0x000F],
    [0x9C7A, 0xAE36, 0xEE88, 0x000F], [0x3DFD, 0x8E7F, 0xEE82, 0x000F], [0xB888, 0xDEA7, 0xEE7B, 0x000F],
    [0x37FF, 0x9BFF, 0xEE74, 0x000F], [0xBD5E, 0xC3A9, 0xEE6C, 0x000F], [0x007E, 0x529E, 0xEE64, 0x000F],
    [0x2888, 0x45A3, 0xEE5B, 0x000F], [0x57B6, 0x994E, 0xEE51, 0x000F], [0x06CF, 0x4A00, 0xEE47, 0x000F],
    [0x2C50, 0x53E1, 0xEE3C, 0x000F], [0x2AD8, 0xB2E0, 0xEE30, 0x000F], [0x8205, 0x62AD, 0xEE24, 0x000F],
    [0x3C5A, 0x5EB8, 0xEE17, 0x000F], [0x1447, 0xA22A, 0xEE09, 0x000F], [0x49CC, 0x27E3, 0xEDFB, 0x000F],
    [0x216C, 0xEA76, 0xEDEB, 0x000F], [0x047E, 0xE422, 0xEDDB, 0x000F], [0x39D3, 0x0ECE, 0xEDCB, 0x000F],
    [0x2CF4, 0x6404, 0xEDB9, 0x000F], [0x38C9, 0xDCE9, 0xEDA6, 0x000F], [0xE98D, 0x7237, 0xED93, 0x000F],
    [0xA836, 0x1C38, 0xED7F, 0x000F], [0xC02B, 0xD2B9, 0xED69, 0x000F], [0xAE00, 0x8D06, 0xED53, 0x000F],
    [0xA422, 0x41DE, 0xED3C, 0x000F], [0x2FD8, 0xE76A, 0xED23, 0x000F], [0xE644, 0x732F, 0xED0A, 0x000F],
    [0xFE34, 0xDA07, 0xECEF, 0x000F], [0xB7B8, 0x100E, 0xECD4, 0x000F], [0x6EB4, 0x0895, 0xECB7, 0x000F],
    [0x30C1, 0xB612, 0xEC98, 0x000F], [0xA978, 0x0A0D, 0xEC79, 0x000F], [0x31FE, 0xF50F, 0xEC57, 0x000F],
    [0xC962, 0x6686, 0xEC35, 0x000F], [0xB335, 0x4CB4, 0xEC11, 0x000F], [0x6FD0, 0x948E, 0xEBEB, 0x000F],
    [0xB692, 0x29A0, 0xEBC4, 0x000F], [0x0CDC, 0xF5EE, 0xEB9A, 0x000F], [0x8542, 0xE1C9, 0xEB6F, 0x000F],
    [0x1F9E, 0xD3AD, 0xEB42, 0x000F], [0x2D4B, 0xB00B, 0xEB13, 0x000F], [0x02E9, 0x591A, 0xEAE2, 0x000F],
    [0x2257, 0xAE99, 0xEAAE, 0x000F], [0xE326, 0x8D8E, 0xEA78, 0x000F], [0x73E5, 0xCFFD, 0xEA3F, 0x000F],
    [0xD9F6, 0x4C8D, 0xEA04, 0x000F], [0x563B, 0xD62F, 0xE9C5, 0x000F], [0x47A4, 0x3BA9, 0xE984, 0x000F],
    [0x4728, 0x471D, 0xE93F, 0x000F], [0xC5D6, 0xBD76, 0xE8F6, 0x000F], [0xE8E6, 0x5DC4, 0xE8AA, 0x000F],
    [0xB1EA, 0xE07A, 0xE859, 0x000F], [0xA940, 0xF690, 0xE804, 0x000F], [0x33C0, 0x4882, 0xE7AB, 0x000F],
    [0x6AA5, 0x751F, 0xE74C, 0x000F], [0xA202, 0x102A, 0xE6E8, 0x000F], [0xABD8, 0xA0B6, 0xE67D, 0x000F],
    [0x307E, 0x9F38, 0xE60C, 0x000F], [0xF742, 0x7338, 0xE594, 0x000F], [0x7280, 0x7097, 0xE514, 0x000F],
    [0xF458, 0xD436, 0xE48B, 0x000F], [0x1E37, 0xBFFD, 0xE3F9, 0x000F], [0xB19C, 0x35EE, 0xE35D, 0x000F],
    [0xE4FE, 0x122F, 0xE2B5, 0x000F], [0x5557, 0x0399, 0xE200, 0x000F], [0x8314, 0x8278, 0xE13C, 0x000F],
    [0x67B0, 0xC4EE, 0xE068, 0x000F], [0x71AA, 0xB02B, 0xDF82, 0x000F], [0xFEAA, 0xC57E, 0xDE87, 0x000F],
    [0x3BFD, 0x09C6, 0xDD75, 0x000F], [0xBF13, 0xE529, 0xDC46, 0x000F], [0x0282, 0xF82E, 0xDAF8, 0x000F],
    [0xBA75, 0xE1B2, 0xD985, 0x000F], [0xCF04, 0xEF48, 0xD7E6, 0x000F], [0x650B, 0xADBD, 0xD613, 0x000F],
    [0xF012, 0x49E2, 0xD401, 0x000F], [0xC7AC, 0xA7B4, 0xD1A1, 0x000F], [0x1F9E, 0x0476, 0xCEE2, 0x000F],
    [0x11B2, 0xD85E, 0xCBA8, 0x000F], [0x2D22, 0x6ECD, 0xC7D2, 0x000F], [0x22ED, 0x2F1E, 0xC32B, 0x000F],
    [0xB83A, 0x81C0, 0xBD65, 0x000F], [0x5434, 0xC400, 0xB606, 0x000F], [0x2874, 0x582A, 0xAC40, 0x000F],
    [0x4598, 0x1E01, 0x9E97, 0x000F], [0x1DFC, 0x48A4, 0x89FA, 0x000F], [0x302C, 0xF7F0, 0x66C5, 0x000F],
    [0x1C4A, 0x4B33, 0x1A5A, 0x000F]
]

const kiUint64: Uint64[] = [];

for (let i = 0; i < 256; i++) {
    const x: Uint64 = new Uint64();
    x.values.set(kiRaw[i]);
    kiUint64.push(x);
}

class RandomDistributions  {
    readonly bitsGenerator: IRandomBitsGenerator;
    private readonly uint64: Uint64;
    private readonly r: Uint64;
    private readonly rabs: Uint64;
    constructor(bitsGenerator: IRandomBitsGenerator)  {
        this.bitsGenerator = bitsGenerator;
        this.uint64 = new Uint64();
        this.r = new Uint64();
        this.rabs = new Uint64();
    }

    // returns next random number in the semi-open interval
    // [0, 1)
    randomUnit(): number {
        this.bitsGenerator.nextUint64(this.uint64);
        return this.uint64.leftmost53bits() * UINT53_TO_DOUBLE;
    }

    randomStandardNormal(): number  {

        const r: Uint64 = this.r;
        const rabs: Uint64 = this.rabs;
        let x: number;
        let xx: number;
        let yy: number;
        while (true) {
            this.bitsGenerator.nextUint64(r);
            const idx: number = r.rightmostByte();
            rabs.copyFrom(r);
            rabs.inplace64RightShift9();
            rabs.clearLeftmost12bits();
            const rabsNum: number = rabs.rightmost52bits();
            x = rabsNum * wiDouble[idx];
            if (r.isBit9fromRightSet())
                x = -x;
            if (rabs.isLessThan(kiUint64[idx]))
                return x; /* 99.3% of the time return here */
            if (idx === 0) {
                const condition: boolean = rabs.isBit9fromRightSet();
                while (true) {
                    /* Switch to 1.0 - U to avoid log(0.0), see GH 13361 */
                    xx = -zigguratNorInvR * Math.log1p(this.randomUnit());
                    yy = -Math.log1p(this.randomUnit());
                    if (yy + yy > xx * xx)
                      return condition ? -(zigguratNorR + xx)
                                         : zigguratNorR + xx;
                }
            }
            else {
                  if (((fiDouble[idx - 1] - fiDouble[idx]) * this.randomUnit() +
                       fiDouble[idx]) < Math.exp(-0.5 * x * x))
                    return x;
            }
        }

    }

}

import { FlashList } from '@shopify/flash-list';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';

type Produto = {
  id?: number;
  nome: string;
  preco: number;
};

export default function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');
  const [produtoEditando, setProdutoEditando] = useState<number | null>(null);

  useEffect(() => {
    iniciar();
  }, []);
  
  const iniciar = async () => {
    try {
      console.log("Criando banco...");
      await criarBanco();
  
      console.log("Listando...");
      await listarProdutos();
  
      console.log("OK");
    } catch (e) {
      console.log("ERRO:", e);
    }
  };

  const abrirBanco = async () => {
    return await SQLite.openDatabaseAsync('meubanco');
  };

  const criarBanco = async () => {
    const db = await abrirBanco();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL
      );
    `);
    await db.closeAsync();
  };

  const listarProdutos = async () => {
    const db = await abrirBanco();
    const resultado = await db.getAllAsync<Produto>('SELECT * FROM produtos');
    setProdutos(resultado);
    await db.closeAsync();
  };

  const addProduto = async () => {
    if (!nomeProduto || !precoProduto) return;

    const db = await abrirBanco();

    await db.runAsync(
      'INSERT INTO produtos (nome, preco) VALUES (?, ?)',
      nomeProduto,
      Number(precoProduto)
    );

    await db.closeAsync();

    setNomeProduto('');
    setPrecoProduto('');
    listarProdutos();
  };

  const deleteProduto = async (id: number) => {
    const db = await abrirBanco();

    await db.runAsync('DELETE FROM produtos WHERE id = ?', id);

    await db.closeAsync();
    listarProdutos();
  };

  const updateProduto = async (id: number) => {
    const db = await abrirBanco();

    await db.runAsync(
      'UPDATE produtos SET nome = ?, preco = ? WHERE id = ?',
      nomeProduto,
      Number(precoProduto),
      id
    );

    await db.closeAsync();

    setNomeProduto('');
    setPrecoProduto('');
    setProdutoEditando(null);

    listarProdutos();
  };

  return (
    <View style={styles.container}>
      
      {/* INPUTS */}
      <View style={styles.linha}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={nomeProduto}
          onChangeText={setNomeProduto}
        />

        <TextInput
          style={styles.input}
          placeholder="Preço"
          keyboardType="numeric"
          value={precoProduto}
          onChangeText={setPrecoProduto}
        />

        <TouchableOpacity
          style={styles.botao}
          onPress={() => {
            if (produtoEditando) {
              updateProduto(produtoEditando);
            } else {
              addProduto();
            }
          }}
        >
          <Text style={{ color: 'white' }}>
            {produtoEditando ? 'Atualizar' : 'Adicionar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      {produtos.length > 0 ? (
        <FlashList
          data={produtos}
          estimatedItemSize={80}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>
                {item.nome} - R${item.preco}
              </Text>

              <View style={styles.linha}>
                <TouchableOpacity
                  style={styles.btnEditar}
                  onPress={() => {
                    setNomeProduto(item.nome);
                    setPrecoProduto(String(item.preco));
                    setProdutoEditando(item.id!);
                  }}
                >
                  <MaterialIcons name="edit" size={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnRemover}
                  onPress={() => deleteProduto(item.id!)}
                >
                  <MaterialIcons name="delete" size={22} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={{ textAlign: 'center' }}>
          Sem produtos cadastrados
        </Text>{/*meu expo não tava querendo abrir, nada de novo sobre o sol */}
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40 },

  linha: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },

  input: {
    borderWidth: 1,
    borderRadius: 5,
    width: '30%',
    padding: 5
  },

  botao: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5
  },

  item: {
    backgroundColor: '#8aff86',
    padding: 20,
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  btnEditar: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 5
  },

  btnRemover: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5
  }
});
